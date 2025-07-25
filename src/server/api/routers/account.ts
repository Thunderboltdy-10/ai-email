import z from "zod";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { emailAddressSchema, emailMessageSchema } from "@/types";
import { Account } from "@/lib/account";
import { OramaClient } from "@/lib/orama";
import { FREE_CREDITS_PER_DAY } from "@/constants";
import { deleteEmail } from "@/lib/aurinko";
import { TrendingUp } from "lucide-react";
import { add } from "lodash";

export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    const account = await db.account.findFirst({
        where: {
            id: accountId,
            userId
        }, select: {
            id: true,
            emailAddress: true,
            name: true,
            accessToken: true
        }
    })

    if (!account) throw new Error("Account not found")
    return account
}

export const accountRouter = createTRPCRouter({
    getAccounts: privateProcedure.query(async ({ctx}) => {
        return await ctx.db.account.findMany({
            where: {
                userId: ctx.auth.userId
            },
            select: {
                id: true,
                emailAddress: true,
                name: true,
            }
        })
    }),
    getNumThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string()
    })).query(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        
        let filter: Prisma.ThreadWhereInput = {}
        if (input.tab === "inbox") {
            filter.inboxStatus = true
        } else if (input.tab === "draft") {
            filter.draftStatus = true
        } else if (input.tab === "sent") {
            filter.sentStatus = true
        }

        return await ctx.db.thread.count({
            where: {
                accountId: account.id,
                ...filter
            }
        })
    }),
    getThreads: privateProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean(),
        offset: z.number()
    })).query(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const acc = new Account(account.accessToken)
        acc.syncEmails().catch(console.error)

        let filter: Prisma.ThreadWhereInput = {}
        if (input.tab === "inbox") {
            filter.inboxStatus = true
        } else if (input.tab === "draft") {
            filter.draftStatus = true
        } else if (input.tab === "sent") {
            filter.sentStatus = true
        }

        filter.done = {
            equals: input.done
        }

        return await ctx.db.thread.findMany({
            where: filter,
            include: {
                emails: {
                    orderBy: {
                        sentAt: "asc"
                    },
                    select: {
                        from: true,
                        body: true,
                        bodySnippet: true,
                        emailLabel: true,
                        subject: true,
                        sysLabels: true,
                        id: true,
                        sentAt: true,
                        to: true,
                        cc: true,
                        bcc: true
                    }
                },
            },
            take: input.offset,
            orderBy: {
                lastMessageDate: "desc"
            }
        })
    }),
    getSuggestions: privateProcedure.input(z.object({
        accountId: z.string()
    })).query(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await ctx.db.emailAddress.findMany({
            where: {
                accountId: account.id
            },
            select: {
                address: true,
                name: true
            }
        })
    }),
    getReplyDetails: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string()
    })).query(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const thread = await ctx.db.thread.findFirst({
            where: {
                id: input.threadId
            },
            include: {
                emails: {
                    orderBy: {sentAt: "asc"},
                    select: {
                        from: true,
                        to: true,
                        cc: true,
                        bcc: true,
                        sentAt: true,
                        subject: true,
                        internetMessageId: true
                    }
                }
            }
        })
        if (!thread || thread.emails.length === 0) throw new Error("Thread not found")
        
        const lastExternalEmail = thread.emails.reverse()[0]
        if (!lastExternalEmail) throw new Error("No external email found")

        return {
            subject: lastExternalEmail.subject,
            to: [lastExternalEmail.from, ...lastExternalEmail.to.filter(to => to.address !== account.emailAddress)],
            cc: lastExternalEmail.cc.filter(cc => cc.address !== account.emailAddress),
            from: {name: account.name, address: account.emailAddress},
            id: lastExternalEmail.internetMessageId
        }
    }),
    sendEmail: privateProcedure.input(z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        to: z.array(emailAddressSchema),

        replyTo: emailAddressSchema,
        inReplyTo: z.string().optional(),
        threadId: z.string().optional()
    })).mutation(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        const acc = new Account(account.accessToken)
        await acc.sendEmail({
            body: input.body,
            subject: input.subject,
            from: input.from,
            to: input.to,
            cc: input.cc,
            bcc: input.bcc,
            replyTo: input.replyTo,
            inReplyTo: input.inReplyTo,
            threadId: input.threadId,
        })
    }),
    searchEmails: privateProcedure.input(z.object({
        accountId: z.string(),
        query: z.string()
    })).mutation(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        const orama = new OramaClient(account.id)
        await orama.initialize()
        
        const results = await orama.search({term: input.query})
        return results
    }),
    changeRead: privateProcedure.input(z.object({
        accountId: z.string(),
        messageId: z.string(),
        removeLabel: z.string().optional(),
        addLabel: z.string().optional()
    })).mutation(async ({ctx, input}) => {
        const email = await ctx.db.email.findUnique({
            where: {
                id: input.messageId
            },
            select: {
                sysLabels: true
            }
        })
        if (!email) throw new Error("Email not found")
        
        let updatedLabels = email.sysLabels
        if (input.removeLabel) {
            updatedLabels = email.sysLabels.filter(label => label !== input.removeLabel)
        }
        
        if (input.addLabel) updatedLabels.push(input.addLabel)

        await ctx.db.email.update({
            where: {
                id: input.messageId
            },
            data: {
                sysLabels: updatedLabels
            }
        })
    }),
    getChatbotInteraction: privateProcedure.input(z.object({
        accountId: z.string()
    })).query(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        const today = new Date().toDateString()
        const chatbotInteraction = await ctx.db.chatBotInteraction.findUnique({
            where: {
                day: today,
                userId: ctx.auth.userId
            }
        })

        const remainingCredits = FREE_CREDITS_PER_DAY - (chatbotInteraction?.count || 0)
        return {remainingCredits}
    }),
    getDone: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string()
    })).query(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        
        const thread = await ctx.db.thread.findUnique({
            where: {
                id: input.threadId,
            },
            select: {
                done: true
            }
        })

        if (!thread) throw new Error("Thread not found")

        return thread.done
    }),
    toggleDone: privateProcedure.input(z.object({
        threadId: z.string(),
        done: z.boolean()
    })).mutation(async ({ctx, input}) => {
        await ctx.db.thread.update({
            where: {
                id: input.threadId
            },
            data: {
                done: input.done
            }
        })
    }),
    deleteMail: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string(),
        messageId: z.string(),
        sentAt: z.string(),
        body: z.string()
    })).mutation(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        
        await deleteEmail(account.accessToken, input.messageId)

        const orama = new OramaClient(account.id)
        await orama.initialize()
        
        await orama.deleteMail({
            threadId: input.threadId,
            sentAt: input.sentAt,
            body: input.body
        })

        await ctx.db.email.delete({
            where: {
                id: input.messageId
            }
        })
    }),
    deleteThread: privateProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string()
    })).mutation(async ({ctx, input}) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        
        await ctx.db.thread.delete({
            where: {
                id: input.threadId
            }
        })

    })
})