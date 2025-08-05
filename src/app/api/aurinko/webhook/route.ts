import { Account } from "@/lib/account"
import { authoriseAccountAccess } from "@/server/api/routers/account"
import { db } from "@/server/db"
import { notificationEmitter } from "@/server/api/routers/notify"   
import useThreads from "@/hooks/use-threads"

export async function handleNotification(payload: any) {
    const accountId = payload.accountId.toString()

    const account = await db.account.findUnique({
        where: {
            id: accountId
        },
        select: {
            accessToken: true
        }
    })

    if (!account) return

    const accessToken = account.accessToken

    const acc = new Account(accessToken)

    if (payload.payloads[0].changeType === "deleted") {
        const messageId = payload.payloads[0].id

        // await acc.deleteEmail(
        //     accountId,

        // )
    }

    acc.syncEmails().catch(console.error)
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