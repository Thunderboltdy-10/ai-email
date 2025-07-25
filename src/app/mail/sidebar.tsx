"use client"
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { Nav } from './nav'
import { File, Inbox, Send } from 'lucide-react'
import { api } from '@/trpc/react'
import useThreads from '@/hooks/use-threads'

type Props = {
    isCollapsed: boolean
}

const Sidebar = ({isCollapsed}: Props) => {
    const {threads} = useThreads()
    const [accountId] = useLocalStorage("accountId", "")
    const [tab] = useLocalStorage<"inbox" | "draft" | "sent">("email-tab", "inbox")

    const {data: inboxThreads, refetch: refetchInbox} = api.account.getNumThreads.useQuery({
        accountId,
        tab: "inbox"
    })
    const {data: draftThreads, refetch: refetchDraft} = api.account.getNumThreads.useQuery({
        accountId,
        tab: "draft"
    })
    const {data: sentThreads, refetch: refetchSent} = api.account.getNumThreads.useQuery({
        accountId,
        tab: "sent"
    })

    React.useEffect(() => {
        if (tab === "inbox") refetchInbox()
        if (tab === "draft") refetchDraft() 
        if (tab === "sent") refetchSent()
    }, [threads])

    return (
        <Nav
        isCollapsed={isCollapsed}
        links={[
            {
                title: "Inbox",
                label: inboxThreads?.toString() ?? "0",
                icon: Inbox,
                variant: tab === "inbox" ? "default" : "ghost"
            },
            {
                title: "Draft",
                label: draftThreads?.toString() ?? "0",
                icon: File,
                variant: tab === "draft" ? "default" : "ghost"
            },
            {
                title: "Sent",
                label: sentThreads?.toString() ?? "0",
                icon: Send,
                variant: tab === "sent" ? "default" : "ghost"
            }
        ]}/>
    )
}

export default Sidebar