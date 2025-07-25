import { OramaClient } from "@/lib/orama"
import { auth } from "@clerk/nextjs/server"

import {streamText, type Message} from "ai"
import {google} from "@ai-sdk/google"
import {createStreamableValue} from "ai/rsc"
import { getSubscriptionStatus } from "@/lib/stripe-actions"
import { db } from "@/server/db"
import { FREE_CREDITS_PER_DAY } from "@/constants"

export async function POST(req: Request) {
    try {
        const {userId} = await auth()
        if (!userId) {
            return new Response("Unauthorised", {status: 401})
        }

        const today = new Date().toDateString()

        const isSubscribed = await getSubscriptionStatus()
        
        const chatbotInteraction = await db.chatBotInteraction.findUnique({
            where: {
                userId
            }
        })

        if (!chatbotInteraction) {
            await db.chatBotInteraction.create({
                data: {
                    day: today,
                    userId,
                    count: 0
                }
            })
        } else if (chatbotInteraction.day !== today) {
            await db.chatBotInteraction.update({
                where: {
                    userId
                },
                data: {
                    day: today,
                    userId,
                    count: 0
                }
            }) 
        } else if (!isSubscribed) {
            if (chatbotInteraction.count >= FREE_CREDITS_PER_DAY) {
                return new Response("You have reached the maximum number of messages for today", {status: 429})
            }
        }

        const {accountId, messages} = await req.json()
        const orama = new OramaClient(accountId)
        await orama.initialize()

        const lastMessage = messages[messages.length - 1]

        const context = await orama.vectorSearch({term: lastMessage.content})
        console.log(context.hits.length + " hits found")

        const prompt = {
            role: "system",
            content: `You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.
            THE TIME NOW IS ${new Date().toLocaleString()}
      
            === EMAIL CONTEXT ===
            ${context.hits.map((hit) => JSON.stringify(hit.document)).join('\n')}
            === END CONTEXT ===
            
            When responding, please keep in mind:
            - Be helpful, clever, and articulate.
            - Rely on the provided email context to inform your responses.
            - If the context does not contain enough information to answer a question, politely say you don't have enough information.
            - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
            - Do not invent or speculate about anything that is not directly supported by the email context.
            - Keep your responses concise and relevant to the user's questions or the email being composed.
            - Only refer back to earlier Q&A or drafts when the user’s **current** message explicitly asks you to—otherwise treat each request independently.`
        }

        const result = streamText({
            model: google("gemini-2.5-flash"),
            onError({error}) {
                console.error(error)
            },
            messages: [prompt, ...messages.filter((message: Message) => message.role === "user")],
            onFinish: async () => {
                await db.chatBotInteraction.update({
                    where: {
                        day: today,
                        userId
                    },
                    data: {
                        count: {
                            increment: 1
                        }
                    }
                })
            }
        })

        return result.toDataStreamResponse()
    } catch (error) {
        console.log("error", error)
        return new Response("Internal Server Error", {status: 500})
    }
}