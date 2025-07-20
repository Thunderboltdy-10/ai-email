"use client"
import React from 'react'
import EmailEditor from './email-editor'
import { api, type RouterOutputs } from '@/trpc/react'
import useThreads from '@/hooks/use-threads'
import { sub } from 'date-fns'
import AvatarIcon from '@/components/avatar-icon'
import { toast } from 'sonner'

const ReplyBox = () => {
    const {threadId, accountId} = useThreads()
    const {data: replyDetails} = api.account.getReplyDetails.useQuery({
        threadId: threadId ?? "",
        accountId
    })

    if (!replyDetails) return null

    return <Component replyDetails={replyDetails} />
}

const Component = ({replyDetails}: {replyDetails: RouterOutputs["account"]["getReplyDetails"]}) => {
    const {threadId, accountId} = useThreads()

    const [subject, setSubject] = React.useState(replyDetails.subject.startsWith("Re:")? replyDetails.subject : `Re: ${replyDetails.subject}`)

    const [toValues, setToValues] = React.useState<{label: React.JSX.Element, value: string}[]>(replyDetails.to.map(to => ({
        label: (
            <span className='flex items-center gap-2'>
                <AvatarIcon name={to.name} address={to.address} style={"h-8 w-8 text-sm"}/>
                {to.address}
            </span>
        ), value: to.address})))

    const [ccValues, setCcValues] = React.useState<{label: React.JSX.Element, value: string}[]>(replyDetails.cc.map(cc => ({
        label: (
            <span className='flex items-center gap-2'>
                <AvatarIcon name={cc.name} address={cc.address} style={"h-8 w-8 text-sm"}/>
                {cc.address}
            </span>
        ), value: cc.address})))

    React.useEffect(() => {
        if (!threadId || !replyDetails) return

        if (!replyDetails.subject.startsWith("Re:")) {
            setSubject(`Re: ${replyDetails.subject}`)
        } else {
            setSubject(replyDetails.subject)
        }

        setToValues(replyDetails.to.map(to => ({
            label: (
                <span className='flex items-center gap-2'>
                    <AvatarIcon name={to.name} address={to.address} style={"h-8 w-8 text-sm"}/>
                    {to.address}
                </span>
            ), value: to.address})))

        setCcValues(replyDetails.cc.map(cc => ({
            label: (
                <span className='flex items-center gap-2'>
                    <AvatarIcon name={cc.name} address={cc.address} style={"h-8 w-8 text-sm"}/>
                    {cc.address}
                </span>
            ), value: cc.address})))

    }, [threadId, replyDetails])

    const sendEmail = api.account.sendEmail.useMutation()

    const handleSend = async (value: string) => {
        if (!replyDetails) return

        sendEmail.mutate({
            accountId,
            threadId: threadId ?? undefined,
            body: value,
            subject,
            from: replyDetails.from,
            to: toValues.map(to => ({name: to.value, address: to.value})),
            cc: ccValues.map(cc => ({name: cc.value, address: cc.value})),

            replyTo: replyDetails.from,
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
    }

    return (
        <EmailEditor 
        subject={subject}
        setSubject={setSubject}

        toValues={toValues}
        setToValues={setToValues}

        ccValues={ccValues}
        setCcValues={setCcValues}

        to={toValues.map(to => to.value)}

        isSending={sendEmail.isPending}
        handleSend={handleSend}
        />
    )
}

export default ReplyBox