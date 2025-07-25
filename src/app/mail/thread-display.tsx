"use client"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import useThreads from '@/hooks/use-threads'
import { ArchiveX, BookmarkCheck, BookmarkMinus, Clock, MessageSquareDot, MoreVertical, Trash2 } from 'lucide-react'
import React, { useRef } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, formatDistanceToNow } from 'date-fns'
import EmailDisplay from './email-display'
import ReplyBox from './reply-box'
import AvatarIcon from '@/components/avatar-icon'
import { atom, useAtom } from 'jotai'
import { isSearchingAtom } from './search-bar'
import SearchDisplay from './search-display'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import { useLocalStorage } from 'usehooks-ts'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { turndown } from '@/lib/turndown'
import { cn } from '@/lib/utils'

export const changedDone = atom(false)
export const startToggle = atom(false)

const ThreadDisplay = () => {
    const {threadId, threads, accountId, setThreadId, refetch} = useThreads()
    const thread = threads?.find(t => t.id === threadId)

    const [isUnread, setIsUnread] = React.useState(thread?.emails.some(email => email?.sysLabels.includes("unread")))
    const [justChanged, setJustChanged] = useAtom(changedDone)

    const lastEmail = useRef<HTMLDivElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [isSearching] = useAtom(isSearchingAtom)
    const [toggle, setToggle] = useAtom(startToggle)

    const [isDeleting, setIsDeleting] = React.useState(false)

    const deleteMail = api.account.deleteMail.useMutation()
    const deleteThread = api.account.deleteThread.useMutation()
    const toggleDone = api.account.toggleDone.useMutation()
    const changeRead = api.account.changeRead.useMutation()

    const [doneMail, setDoneMail] = React.useState<boolean | null>(null)

    const {data: isDone, refetch: refetchDone} = api.account.getDone.useQuery({
        accountId,
        threadId: threadId ?? "",
    }, {
        enabled: !!accountId && !!threadId
    })
    
    const changeDone = () => {
        const newDone = !doneMail
        
        if (threadId) {
            setDoneMail(newDone)
            toggleDone.mutate({
                threadId,
                done: newDone
            })
            setJustChanged(true)

            setTimeout(() => {
                refetch()
                refetchDone()
            }, 300)
        }
    }

    const trashEmail = () => {
        if (!thread) return

        setIsDeleting(true)

        let pending = thread.emails.length
        if (pending === 0) return
        
        try {
            for (const email of thread.emails) {
                const body = turndown.turndown(email.body ?? email.bodySnippet ?? "")

                deleteMail.mutate({
                    accountId,
                    threadId: threadId ?? "",
                    messageId: email.id,
                    sentAt: email.sentAt.toISOString(),
                    body
                }, {
                    onSuccess: () => {
                        pending -= 1
                        if (pending === 0) {
                            deleteThread.mutate({
                                accountId,
                                threadId: threadId ?? ""
                            }, {
                                onSuccess: () => {
                                    toast.success("Thread moved to trash")
                                    setThreadId(null)
                                    setIsDeleting(false)
                                    refetch()
                                }
                            })
                        }
                    }
                })
            }
        } catch (error) {
            toast.error("Error moving email to trash")
            console.error(error)
        }
        
    }

    const markUnread = () => {
        if (!thread) return

        setIsUnread(true)
        thread.emails.map(email => {
            changeRead.mutate({
                accountId,
                messageId: email.id,
                addLabel: "unread"
            })
        })
        refetch()
    }

    React.useEffect(() => {
        if (typeof isDone !== "undefined") {
            setDoneMail(isDone)
        }
    }, [isDone])

    React.useEffect(() => {
        if (thread?.emails.length && lastEmail.current && containerRef.current) {
            containerRef.current.scrollTo({top: 0})
            lastEmail.current.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"})
        }
        setIsUnread(thread?.emails.some(email => email?.sysLabels.includes("unread")))
    }, [threadId])

    React.useEffect(() => {
        if (toggle) {
            changeDone()
            setToggle(false)
        }
    }, [toggle])

    return (
        <div className='flex flex-col h-full'>
            <div className='flex items-center p-2'>
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={doneMail ? "outline" : "ghost"} size="icon" disabled={!thread} onClick={changeDone} className='cursor-pointer'>
                                {doneMail ? <BookmarkMinus className='size-4'/> : <BookmarkCheck className='size-4'/>}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {doneMail ? <p>Mark as pending</p> : <p>Mark as done</p>}
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={"ghost"} size="icon" disabled={!thread || isDeleting} onClick={trashEmail} className='cursor-pointer'>
                                <Trash2 className='size-4'/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={isUnread ? "outline" : "ghost"} size="icon" disabled={!thread || isUnread} onClick={markUnread} className='cursor-pointer'>
                                <MessageSquareDot className='size-4'/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Mark as unread</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Separator orientation='vertical' className='ml-2'/>
                <Button className="ml-2" variant={"ghost"} size="icon" disabled={!thread}>
                    <Clock className='size-4'/>
                </Button>
            </div>
            <Separator />
            {isSearching ? <SearchDisplay /> : (
                <>
                    {thread ? <>
                        <ResizablePanelGroup direction="vertical" className='flex flex-col flex-1 overflow-auto'>
                            <div className="flex items-center p-4">
                                <div className='flex items-center gap-4 text-sm'>
                                    <AvatarIcon name={thread.emails[0]?.from?.name} address={thread.emails[0]?.from?.address} style={"h-12 w-12 text-lg"}/>
                                    <div className='grid gap-1'>
                                        <div className="font-semibold">
                                            {thread.emails[0]?.from.name}
                                            <div className="text-sm line-clamp-1">
                                                {thread.emails[0]?.subject}
                                            </div>
                                            <div className="text-xs line-clamp-1">
                                                <span className='font-medium'>
                                                    From:
                                                </span>
                                                {thread.emails[0]?.from?.address}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {thread.emails[0]?.sentAt && (
                                    <div className={
                                        cn("ml-auto text-sm")
                                    }>
                                        {formatDistanceToNow(thread.emails[0]?.sentAt ?? new Date(), {addSuffix: true})}
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <ResizablePanel className="flex flex-col">
                                <div className="p-6 flex flex-col gap-4 overflow-y-auto overflow-x-hidden" ref={containerRef}>
                                    {thread.emails.map((email, index) => 
                                        index === thread.emails.length - 1 ? (
                                            <div ref={lastEmail} key={email.id} className='scroll-margin-top-[50px]'>
                                                <EmailDisplay email={email}/>
                                            </div>
                                        ) : <EmailDisplay key={email.id} email={email}/>
                                    )}
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel className="flex-1 h-full" minSize={24} defaultSize={24}>
                                <Separator className='mt-auto'/>
                                <ReplyBox />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </> : <>
                        <div className='p-8 text-center text-muted-foreground'>
                            No message selected
                        </div>
                    </>}
                </>
            )}
        </div>
    )
}

export default ThreadDisplay