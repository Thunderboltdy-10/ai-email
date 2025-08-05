"use client"
import React from 'react'
import EmailEditor from './email-editor'
import { api, type RouterOutputs } from '@/trpc/react'
import useThreads from '@/hooks/use-threads'
import { sub } from 'date-fns'
import AvatarIcon from '@/components/avatar-icon'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { currentMessage, replyType } from './thread-display'
import { format } from 'date-fns'

const ReplyBox = () => {
    const {threadId, accountId} = useThreads()
    
    const [replyOptions, setReplyOptions] = useAtom(replyType)
    const [messageId, setMessageId] = useAtom(currentMessage)

    const {data: replyDetails} = api.account.getReplyDetails.useQuery({
        threadId: threadId ?? "",
        messageId,
        accountId
    })

    if (!replyDetails) return null

    return <Component replyDetails={replyDetails} replyOptions={replyOptions} messageId={messageId} />
}

const Component = ({replyDetails, replyOptions, messageId}: {replyDetails: RouterOutputs["account"]["getReplyDetails"], replyOptions: string, messageId: string | undefined}) => {
    const {threadId, accountId, account} = useThreads()

    const [subject, setSubject] = React.useState("")

    const [toValues, setToValues] = React.useState<{label: React.JSX.Element, value: {name: string | null, address: string}}[]>([])

    const [ccValues, setCcValues] = React.useState<{label: React.JSX.Element, value: {name: string | null, address: string}}[]>([])

    React.useEffect(() => {
        if (!threadId || !replyDetails) return

        if (replyOptions === "reply" || replyOptions === "replyall") {
            setSubject(replyDetails.subject.startsWith("Re:") ? replyDetails.subject : `Re: ${replyDetails.subject}`)

            setToValues([{
                label: (
                    <span className='flex items-center gap-2'>
                        <AvatarIcon name={replyDetails.from.name} address={replyDetails.from.address} style={"h-8 w-8 text-sm"}/>
                        {replyDetails.from.address}
                    </span>
                ), value: {name: replyDetails.from.name, address: replyDetails.from.address}
            }])
        } else {
            setSubject(`Fwd: ${replyDetails.subject}`)
            setToValues([])
        }

        if (replyOptions === "replyall") {
            setSubject(replyDetails.subject.startsWith("Re:") ? replyDetails.subject : `Re: ${replyDetails.subject}`)

            setCcValues([
            ...replyDetails.to.filter(to => to.address != account?.emailAddress && to.address != replyDetails.from.address).map(to => ({
                label: (
                    <span className='flex items-center gap-2'>
                        <AvatarIcon name={to.name} address={to.address} style={"h-8 w-8 text-sm"}/>
                        {to.address}
                    </span>
                ), value: {name: to.name, address: to.address}
            })),
            ...replyDetails.cc.map(cc => ({
                label: (
                    <span className='flex items-center gap-2'>
                        <AvatarIcon name={cc.name} address={cc.address} style={"h-8 w-8 text-sm"}/>
                        {cc.address}
                    </span>
                ), value: {name: cc.name, address: cc.address}
            }))])
        } else {
            setCcValues([])
        }

    }, [threadId, replyDetails, replyOptions, messageId])

    const sendEmail = api.account.sendEmail.useMutation()

    const handleSend = async (value: string) => {
        if (!replyDetails || !account) return

        if (toValues.length < 1) {
            toast.error("Please select at least one recipient")
            return
        }
        
        let body = value

        if (messageId || replyOptions === "forward") {
            const quotedReply = `
            <p style="margin: 0">
                ${replyDetails.sentAt ? `On ${format(new Date(replyDetails.sentAt), "PPp")},` : ""} ${replyDetails.from.address} wrote:
            </p>
            <blockquote style="margin-top: 0.5em; padding-left: 1em; border-left: 2px solid #ccc">
                ${replyDetails.body}
            </blockquote>
            `

            body =  `
            <div>
                <div>${value}</div>
                <br>
                ${quotedReply}
            </div>
            `
        }

        sendEmail.mutate({
            accountId,
            threadId: threadId ?? undefined,
            messageId,
            body,
            subject,
            from: {name: account.name, address: account.emailAddress},
            to: toValues.map(to => ({name: to.value.name ?? to.value.address, address: to.value.address})),
            cc: ccValues.map(cc => ({name: cc.value.name ?? cc.value.address, address: cc.value.address})),

            replyTo: {name: account.name, address: account.emailAddress},
            inReplyTo: replyDetails.id
        }, {
            onSuccess: () => {
                toast.success("Email sent!")
            },
            onError: (error) => {
                console.error(error)
                toast.error("Error sending email")
            }
        })

        setToValues([])
        setCcValues([])
        setSubject("")
    }

    return (
        <EmailEditor 
        subject={subject}
        setSubject={setSubject}

        toValues={toValues}
        setToValues={setToValues}

        ccValues={ccValues}
        setCcValues={setCcValues}

        to={[...toValues.map(to => to.value.address), ...ccValues.map(cc => cc.value.address)]}

        isSending={sendEmail.isPending}
        handleSend={handleSend}
        />
    )
}

export default ReplyBox