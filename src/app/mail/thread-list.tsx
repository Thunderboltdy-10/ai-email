"use client"
import useThreads from '@/hooks/use-threads'
import React, {  useCallback, useMemo, useRef, type ComponentProps } from 'react'
import {format, formatDistanceToNow} from "date-fns"
import { cn } from '@/lib/utils'
import DOMPurify from 'dompurify'
import { Badge } from '@/components/ui/badge'
import { useLocalStorage } from 'usehooks-ts'
import throttle from "lodash/throttle"
import { atom, useAtom } from 'jotai'
import { Loader } from 'lucide-react'
import { isSearchingAtom } from './search-bar'
import { api } from '@/trpc/react'
import { changedDone } from './thread-display'
import { OFFSET_PER_FETCH, STARTING_OFFSET } from '@/constants'

export const offsetNumAtom = atom(STARTING_OFFSET)

const ThreadList = ({right}: {right?: boolean}) => {
    const {threads, threadId, setThreadId, accountId, refetch, isLoading} = useThreads()
    const [offsetAtom, setOffsetAtom] = useAtom(offsetNumAtom)
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom)

    const [hasMore, setHasMore] = React.useState<boolean>(true)
    
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = React.useState(false)
    const [justChanged, setJustChanged] = useAtom(changedDone)

    const [tab] = useLocalStorage<"inbox" | "draft" | "sent">("email-tab", "inbox")
    const [done] = useLocalStorage("email-done", false)

    const changeRead = api.account.changeRead.useMutation()

    const groupedThreads = React.useMemo(() => {
        return threads?.reduce((acc, thread) => {
            const date = format(thread.emails[thread.emails.length - 1]?.sentAt ?? new Date(), "yyyy-MM-dd")
            if (!acc[date]) {
                acc[date] = []
            }
            acc[date].push(thread)
            return acc
        }, {} as Record<string, typeof threads>)
    }, [threads])

    function scrollMessages() {
        if (!hasMore) return

        setOffsetAtom(offsetAtom + OFFSET_PER_FETCH)
        refetch()
    }

    const throttledScrollMessages = useMemo(() => throttle(() => {
        scrollMessages()
    }, 10000), [scrollMessages])

    const handleScroll = () => {
        const el = containerRef.current
        if (!el || loading) return

        const { scrollTop, clientHeight, scrollHeight } = el

        if (scrollTop + clientHeight >= scrollHeight) {
            setLoading(true)
            throttledScrollMessages()
        }
    }

    React.useEffect(() => {
        groupedThreads
    }, [])

    React.useEffect(() => {
        setLoading(false)

        if (!threads) return

        setHasMore(threads.length % OFFSET_PER_FETCH === 0)
    }, [threads])

    React.useEffect(() => {
        if (justChanged) {
            setJustChanged(false)
            setTimeout(() => refetch(), 300)
        } else {
            setOffsetAtom(STARTING_OFFSET)
        }
    }, [done])

    return (
        <div className={`max-w-full overflow-y-auto max-h-[calc(100vh-120px)] ${right ? "animate-fade-right" : "animate-fade-left"}`} ref={containerRef} onScroll={handleScroll}>
            <div className="flex flex-col gap-2 p-4 pt-0">
                {threads?.length === 0 && (
                    <div className="text-sm font-medium text-muted-foreground mt-5 first:mt-0 justify-center">
                        No {done ? "done" : "pending"} {tab} emails
                    </div>
                )}
                {Object.entries(groupedThreads ?? {}).map(([date, threads]) => {
                    return <React.Fragment key={date}>
                        <div className="text-xs font-medium text-muted-foreground mt-5 first:mt-0">
                            {date}
                        </div>
                        {threads.map(thread => {
                            return <button
                                onClick={(() => {
                                    setIsSearching(false)
                                    if (threadId === thread.id) {
                                        setThreadId(null)
                                    } else {
                                        setThreadId(thread.id)
                                    }

                                    if (thread.emails.some(email => email?.sysLabels.includes("unread"))) {
                                        thread.emails.map(email => {
                                            changeRead.mutate({
                                                accountId,
                                                messageId: email.id,
                                                removeLabel: "unread"
                                            })
                                        })
                                        refetch()
                                    }
                                })}
                                key={thread.id}
                                className={
                                cn("flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all relative cursor-pointer focus:outline-none", {
                                    "bg-accent": thread.id === threadId
                                }, {
                                    "bg-secondary !font-bold outline-1": thread.emails.some(email => email?.sysLabels.includes("unread"))
                                })
                            }>
                                <div className='flex flex-col w-full gap-2'>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 line-clamp-1">
                                            <div className="font-semibold">
                                                {thread.emails.at(-1)?.from.name}
                                            </div>
                                        </div>
                                        <div className={
                                            cn("ml-auto text-xs min-w-[20px]")
                                        }>
                                            {formatDistanceToNow(thread.emails.at(-1)?.sentAt ?? new Date(), {addSuffix: true})}
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium">
                                        {thread.subject}
                                    </div>
                                </div>
                                <div className='text-xs line-clamp-2 text-muted-foreground'
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(thread.emails.at(-1)?.bodySnippet ?? "", {
                                        USE_PROFILES: {html: true}
                                    })
                                }}></div>
                                {thread.emails[0]?.sysLabels.length && (
                                    <div className='flex items-center gap-2'>
                                        {thread.emails[0]?.sysLabels.map(label => {
                                            return <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                                                {label}
                                            </Badge>
                                        })}
                                    </div>
                                )}
                            </button>
                        })}
                    </React.Fragment>
                })}
                {loading && (
                    <div className='pb-4 flex flex-row items-center justify-center text-gray-600 gap-2'>
                        <Loader className='size-4 animate-spin' />
                        <div className=''>Loading previous emails...</div>
                    </div>
                )}
            </div>
        </div>
    )
}

function getBadgeVariantFromLabel(label: string): ComponentProps<typeof Badge>["variant"] {
    if (["work"].includes(label.toLowerCase())) {
        return "default"
    }
    return "secondary"
}

export default ThreadList