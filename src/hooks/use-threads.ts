import { api } from '@/trpc/react'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'
import {atom, useAtom} from "jotai"
import { offsetNumAtom } from '@/app/mail/thread-list'

export const threadIdAtom = atom<string | null>(null)

const useThreads = () => {
    const {data: accounts} = api.account.getAccounts.useQuery()
    const [accountId] = useLocalStorage("accountId", "")

    const [tab] = useLocalStorage("email-tab", "inbox")
    const [done] = useLocalStorage("email-done", false)

    const [threadId, setThreadId] = useAtom(threadIdAtom)
    const [offset, setOffset] = useAtom(offsetNumAtom)

    const {data: threads, isFetching, refetch, isLoading} = api.account.getThreads.useQuery({
        accountId,
        tab,
        done,
        offset
    }, {
        enabled: !!accountId && !!tab, placeholderData: e => e,
        // refetchInterval: 5000000
    })

    return {
        threads,
        isFetching,
        refetch,
        accountId,
        threadId,
        setThreadId,
        account: accounts?.find(e => e.id === accountId),
        setOffset,
        isLoading
    }
}

export default useThreads