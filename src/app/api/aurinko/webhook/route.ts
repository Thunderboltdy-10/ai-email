import { Account } from "@/lib/account"
import { authoriseAccountAccess } from "@/server/api/routers/account"
import { db } from "@/server/db"
import { notificationEmitter } from "@/server/api/routers/notify"   
import useThreads from "@/hooks/use-threads"

export async function handleNotification(payload: any) {
    const accountId = payload.accountId.toString()

    const acc = await db.account.findUnique({
        where: {
            id: accountId
        },
        select: {
            accessToken: true
        }
    })

    if (!acc) return

    const accessToken = acc.accessToken

    const account = new Account(accessToken)

    if (payload.payloads[0].changeType === "deleted") {
    }
    account.syncEmails().catch(console.error)
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url)
        const challenge = url.searchParams.get("validationToken")

        if (challenge) {
            return new Response(challenge, {status: 200})
        } else {
            const body = await req.text()
            const payload = JSON.parse(body)

            console.log(payload)
            handleNotification(payload)
            return new Response("OK", {status: 200})    
        }

    } catch (error) {
        console.error(error)
        return new Response("Error", {status: 500,})
    }
}