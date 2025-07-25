"use server"

import axios from "axios"
import { auth } from "@clerk/nextjs/server"
import { getSubscriptionStatus } from "./stripe-actions"
import { db } from "@/server/db"
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from "@/constants"
import { headers } from "next/headers"

export const getAurinkoAuthUrl = async (serviceType: "Google" | "Office3655") => {
    const {userId} = await auth()
    if (!userId) throw new Error("Unauthorised")

    const isSubscribed = await getSubscriptionStatus()
    const accounts = await db.account.count({
        where: {
            userId
        }
    })

    if (isSubscribed) {
        if (accounts >= PRO_ACCOUNTS_PER_USER) {
            throw new Error("You have reached the maximum number of accounts")
        }
    } else {
        if (accounts >= FREE_ACCOUNTS_PER_USER) {
            throw new Error("You have reached the maximum number of accounts")
        }
    }

    const params = new URLSearchParams({
        clientId: process.env.AURINKO_CLIENT_ID as string,
        serviceType,
        scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
        responseType: "code",
        returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`
    })
    
    return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`
}

export const exchangeCodeForAccessToken = async (code: string) => {
    try {
        const response = await axios.post(`https://api.aurinko.io/v1/auth/token/${code}`, {}, {
            auth: {
                username: process.env.AURINKO_CLIENT_ID as string,
                password: process.env.AURINKO_CLIENT_SECRET as string,
            },
        })
        return response.data as {
            accountId: number,
            accessToken: string,
            userId: string,
            userSession: string
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error fetching account details:", error.response?.data)
        } else {
            console.error("Unexpected error fetching account details:", error)
        }
        throw error
    }
}

export const getAccountDetails = async (accessToken: string) => {
    try {
        const response = await axios.get("https://api.aurinko.io/v1/account", {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })
        return response.data as {
            email: string,
            name: string
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error fetching account details:", error.response?.data)
        } else {
            console.error("Unexpected error fetching account details:", error)
        }
        throw error
    }
}

export const deleteEmail = async (accessToken: string, messageId: string) => {
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

export const pushNotification = async (accessToken: string) => {
    try {
        const response = await axios.post("https://api.aurinko.io/v1/subscriptions", {
            resource: "/email/messages",
            notificationUrl: `http://synapse-mail.duckdns.org:3000/api/aurinko/webhook`,
            filters: ["withoutDrafts"]
        }, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            }
        })

        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error pushing notification:", error.response?.data)
        } else {
            console.error("Unexpected error pushing notification:", error)
        }
    }
}   