import { db } from "@/server/db"
import type { EmailAddress, EmailMessage, SyncDeletedResponse, SyncResponse, SyncUpdatedResponse } from "@/types"
import axios from "axios"
import { sub } from "date-fns"
import { syncEmailsToDatabase } from "./sync-to-db"

export class Account {
    private token: string

    constructor(token: string) {
        this.token = token
    }

    private async startSync() {
        const response = await axios.post<SyncResponse>("https://api.aurinko.io/v1/email/sync", {}, {
            headers: {  
                Authorization: `Bearer ${this.token}`
            },
            params: {
                daysWithin: 1,
                bodyType: "html"
            }
        })
        return response.data
    }

    async getUpdatedEmails({deltaToken, pageToken}: {deltaToken?: string, pageToken?: string}) {
        let params: Record<string, string> = {}
        if (deltaToken) params.deltaToken = deltaToken
        if (pageToken) params.pageToken = pageToken

        const response = await axios.get<SyncUpdatedResponse>("https://api.aurinko.io/v1/email/sync/updated", {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params
        })  
        return response.data
    }

    async getDeletedEmails({deltaToken, pageToken}: {deltaToken?: string, pageToken?: string}) {
        let params: Record<string, string> = {}
        if (deltaToken) params.deltaToken = deltaToken
        if (pageToken) params.pageToken = pageToken

        const response = await axios.get<SyncDeletedResponse>("https://api.aurinko.io/v1/email/sync/deleted", {
            headers: {
                Authorization: `Bearer ${this.token}`
            },
            params
        })  
        return response.data
    }

    async performInitialSync() {
        try {
            let syncResponse = await this.startSync()
            while (!syncResponse.ready) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                syncResponse = await this.startSync()
            }

            let storedUpdateDeltaToken: string = syncResponse.syncUpdatedToken
            let storedDeleteDeltaToken: string = syncResponse.syncDeletedToken

            let updatedResponse = await this.getUpdatedEmails({deltaToken: storedUpdateDeltaToken})
            if (updatedResponse.nextDeltaToken) {
                storedUpdateDeltaToken = updatedResponse.nextDeltaToken
            }

            let allEmails : EmailMessage[] = updatedResponse.records

            while (updatedResponse.nextPageToken) {
                updatedResponse = await this.getUpdatedEmails({pageToken: updatedResponse.nextPageToken})
                allEmails = allEmails.concat(updatedResponse.records)

                if (updatedResponse.nextDeltaToken) { 
                    storedUpdateDeltaToken = updatedResponse.nextDeltaToken
                }
            }

            console.log("Initial sync completed, we have synced", allEmails.length, "emails")

            return {
                emails: allEmails,
                updateDeltaToken: storedUpdateDeltaToken,
                deleteDeltaToken: storedDeleteDeltaToken
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error during sync:", JSON.stringify(error.response?.data, null, 2))
            } else {
                console.error("Error during sync:", error)
            }
        }
    }

    async syncEmails() {
        const account = await db.account.findUnique({
            where: {accessToken: this.token}
        })
        if (!account) throw new Error("Account not found")
        if (!account.updateDeltaToken) throw new Error("Account not ready for sync")

        let response = await this.getUpdatedEmails({
            deltaToken: account.updateDeltaToken
        })
        let storedUpdateDeltaToken = account.updateDeltaToken
        let allEmails: EmailMessage[] = response.records

        if (response.nextDeltaToken) {
            storedUpdateDeltaToken = response.nextDeltaToken
        }

        while (response.nextPageToken) {
            response = await this.getUpdatedEmails({pageToken: response.nextPageToken})
            allEmails = allEmails.concat(response.records)
            if (response.nextDeltaToken) {
                storedUpdateDeltaToken = response.nextDeltaToken
            }
        }

        try {
            syncEmailsToDatabase(allEmails, account.id)
        } catch (error) {
            console.error("Error during sync:", error)
        }

        await db.account.update({
            where: {id: account.id},
            data: {
                updateDeltaToken: storedUpdateDeltaToken
            }
        })

        return {
            emails: allEmails,
            updateDeltaToken: storedUpdateDeltaToken
        }
    }

    async syncDeletedEmails() {
        const account = await db.account.findUnique({
            where: {accessToken: this.token}
        })
        if (!account) throw new Error("Account not found")
        if (!account.deleteDeltaToken) throw new Error("Account not ready for sync")

        let response = await this.getDeletedEmails({
            deltaToken: account.deleteDeltaToken
        })
        let storedDeleteDeltaToken = account.deleteDeltaToken
        let allEmails: EmailMessage[] = response.records

        if (response.nextDeltaToken) {
            storedDeleteDeltaToken = response.nextDeltaToken
        }

        while (response.nextPageToken) {
            response = await this.getDeletedEmails({pageToken: response.nextPageToken})
            allEmails = allEmails.concat(response.records)
            if (response.nextDeltaToken) {
                storedDeleteDeltaToken = response.nextDeltaToken
            }
        }

        try {
            syncEmailsToDatabase(allEmails, account.id)
        } catch (error) {
            console.error("Error during sync:", error)
        }

        await db.account.update({
            where: {id: account.id},
            data: {
                deleteDeltaToken: storedDeleteDeltaToken
            }
        })

        return {
            emails: allEmails,
            deleteDeltaToken: storedDeleteDeltaToken
        }
    }

    async sendEmail({
        from,
        subject,
        body,
        inReplyTo,
        threadId,
        references,
        to,
        cc,
        bcc,
        replyTo
    }: {
       from: EmailAddress,
       subject: string,
       body: string,
       inReplyTo?: string,
       threadId?: string,
       references?: string,
       to: EmailAddress[],
       cc?: EmailAddress[],
       bcc?: EmailAddress[],
       replyTo?: EmailAddress,
    }) {
        try {
            const response = await axios.post("https://api.aurinko.io/v1/email/messages", {
                from,
                subject,
                body,
                inReplyTo,
                threadId,
                references,
                to,
                cc,
                bcc,
                replyTo: [replyTo]
            }, {
                params: {
                    returnIds: true
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            })
            console.log("Email sent", response.data)
            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error sending email:", JSON.stringify(error.response?.data, null, 2))
            } else {
                console.error("Error sending email:", error)
            }
        }
    }

    async replyEmail({
        from,
        subject,
        body,
        inReplyTo,
        messageId,
        references,
        to,
        cc,
        bcc,
        replyTo
    }: {
       from: EmailAddress,
       subject: string,
       body: string,
       inReplyTo?: string,
       messageId: string,
       references?: string,
       to: EmailAddress[],
       cc?: EmailAddress[],
       bcc?: EmailAddress[],
       replyTo?: EmailAddress,
    }) {
        try {
            const response = await axios.post(`https://api.aurinko.io/v1/email/messages/${messageId}/reply`, {
                from,
                subject,
                body,
                to,
                cc,
                bcc,
                replyTo: [replyTo]
            }, {
                params: {
                    returnIds: true
                },
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            })
            console.log("Email sent", response.data)
            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error sending email:", JSON.stringify(error.response?.data, null, 2))
            } else {
                console.error("Error sending email:", error)
            }
        }
    }

    async deleteEmail (accessToken: string, messageId: string) {
        try {
            const response = await axios.delete(`https://api.aurinko.io/v1/email/messages/${messageId}`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            return response.data as {
                status: string
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error deleting email:", error.response?.data)
            } else {
                console.error("Unexpected error deleting email:", error)
            }
            throw error
        }
    }

    async setAttachment (messageId: string, attachmentId: string) {
        try {
            const response = await axios.get(`https://api.aurinko.io/v1/email/messages/${messageId}/attachments/${attachmentId}`, {
                headers: {
                    "Authorization": `Bearer ${this.token}`
                }
            })
            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error getting attachment:", error.response?.data)
            } else {
                console.error("Unexpected error getting attachment:", error)
            }
            throw error
        }
    }
}