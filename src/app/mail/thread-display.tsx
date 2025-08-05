"use client"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import useThreads from '@/hooks/use-threads'
import { ArchiveX, BookmarkCheck, BookmarkMinus, Clock, Forward, MessageSquareDot, MoreVertical, Reply, ReplyAll, Trash2 } from 'lucide-react'
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
import { api, type RouterOutputs } from '@/trpc/react'
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
import { Panel } from 'react-resizable-panels'
import DeleteButton from './delete-button'

export const changedDone = atom(false)
export const startToggle = atom(false)

export const replyType = atom("reply")
export const currentMessage = atom<string | undefined>(undefined)

const ThreadDisplay = () => {
    const {threadId, threads, accountId, setThreadId, refetch} = useThreads()
    const thread = threads?.find(t => t.id === threadId)

    const [isUnread, setIsUnread] = React.useState(thread?.emails.some(email => email?.sysLabels.includes("unread")))
    const [justChanged, setJustChanged] = useAtom(changedDone)

    const lastEmail = useRef<HTMLDivElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [isSearching] = useAtom(isSearchingAtom)
    const [toggle, setToggle] = useAtom(startToggle)

    const [replyOptions, setReplyOptions] = useAtom(replyType)
    const [messageId, setMessageId] = useAtom(currentMessage)   

    const [isDeleting, setIsDeleting] = React.useState(false)
    const [newestEmail, setNewestEmail] = React.useState<RouterOutputs["account"]["getThreads"][0]["emails"][0]>()

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
        if (!thread || !thread.emails[0]) return

        if (isUnread) {
            thread.emails.map(email => {
                changeRead.mutate({
                    accountId,
                    messageId: email.id,
                    removeLabel: "unread"
                })
            })
        } else  {
            changeRead.mutate({
                accountId,
                messageId: thread.emails[0].id,
                addLabel: "unread"
            })
        }
        setIsUnread(!isUnread)
        setTimeout(() => refetch(), 200)
    }

    const changeReplyOptions = (option: string) => {
        if (option === replyOptions && !messageId) return

        setReplyOptions(option)
        setMessageId(undefined)
    }

    React.useEffect(() => {
        if (typeof isDone !== "undefined") {
            setDoneMail(isDone)
        }
    }, [isDone])

    React.useEffect(() => {
        if (thread?.emails.length && lastEmail.current) {
            requestAnimationFrame(() => {
                console.log("Scrolling to:", lastEmail.current);
                containerRef.current?.scrollTo({top: 0})
                lastEmail.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "nearest"
                });
            });
        }

        setNewestEmail(thread?.emails.at(-1));
        setIsUnread(thread?.emails.some(email => email?.sysLabels.includes("unread")));
    }, [threadId]);


    React.useEffect(() => {
        if (toggle) {
            changeDone()
            setToggle(false)
        }
    }, [toggle])

    return (
        <div className='flex flex-col h-full'>
            {!isSearching && (
                <div className='flex items-center p-2'>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant={doneMail ? "outline" : "ghost"}
                                size="icon"
                                disabled={!thread}
                                onClick={changeDone}
                                className={cn(
                                    "cursor-pointer",
                                    doneMail
                                        ? "!bg-green-100 !text-green-800 hover:!bg-green-200"
                                        : "!text-green-600 hover:!bg-green-100"
                                )}>
                                    {doneMail ? <BookmarkMinus className='size-4'/> : <BookmarkCheck className='size-4'/>}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {doneMail ? <p>Mark as pending</p> : <p>Mark as done</p>}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant={isUnread ? "outline" : "ghost"}
                                size="icon"
                                disabled={!thread}
                                onClick={markUnread}
                                className={cn(
                                    "cursor-pointer",
                                    isUnread
                                        ? "!bg-orange-100 !text-orange-800 hover:!bg-orange-200"
                                        : "!text-orange-600 hover:!bg-orange-100"
                                )}>
                                    <MessageSquareDot className='size-4'/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isUnread ? <p>Mark as read</p> : <p>Mark as unread</p>}
                            </TooltipContent>
                        </Tooltip>
                        <DeleteButton title="Delete Thread" description="Are you sure you want to delete thread?" thread={thread} isDeleting={isDeleting} trashEmail={trashEmail} inMail={false}/>
                    </div>
                    <Separator orientation='vertical' className='mx-2'/>
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant={replyOptions === "reply" && messageId === undefined ? "outline" : "ghost"}
                                size="icon"
                                disabled={!thread}
                                onClick={() => changeReplyOptions("reply")}
                                className={cn(
                                    "cursor-pointer",
                                    replyOptions === "reply" && messageId === undefined
                                        ? "!bg-purple-100 !text-purple-800 hover:!bg-purple-200"
                                        : "!text-purple-600 hover:!bg-purple-100"
                                )}>
                                    <Reply className='size-4'/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reply</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant={replyOptions === "replyall" && messageId === undefined ? "outline" : "ghost"}
                                size="icon"
                                disabled={!thread}
                                onClick={() => changeReplyOptions("replyall")}
                                className={cn(
                                    "cursor-pointer",
                                    replyOptions === "replyall" && messageId === undefined
                                        ? "!bg-purple-200 !text-purple-900 hover:!bg-purple-300"
                                        : "!text-purple-700 hover:!bg-purple-200"
                                )}>
                                    <ReplyAll className='size-4'/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reply All</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant={replyOptions === "forward" && messageId === undefined ? "outline" : "ghost"}
                                size="icon"
                                disabled={!thread}
                                onClick={() => changeReplyOptions("forward")}
                                className={cn(
                                    "cursor-pointer",
                                    replyOptions === "forward" && messageId === undefined
                                    ? "!bg-blue-200 !text-blue-900 hover:!bg-blue-300"
                                    : "!text-blue-700 hover:!bg-blue-200"
                                )}>
                                    <Forward className='size-4'/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Forward</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            )}
            <Separator />
            {isSearching ? <SearchDisplay /> : (
                <>
                    {thread ? <>
                        <ResizablePanelGroup direction="vertical" className='flex flex-col flex-1 overflow-auto'
                        >
                            <div className="flex items-center p-4">
                                <div className='flex items-center gap-4 w-full'>
                                    <div className='flex items-center gap-2 text-sm'>
                                        <AvatarIcon name={newestEmail?.from?.name} address={newestEmail?.from?.address} style={"h-12 w-12 text-lg"}/>
                                        <div className='grid gap-1'>
                                            <div className="font-semibold">
                                                {newestEmail?.from.name}
                                                <div className="text-sm">
                                                    {newestEmail?.subject}
                                                </div>
                                                <div className="text-xs">
                                                    <span className='font-medium'>
                                                        From: {" "}
                                                    </span>
                                                    {newestEmail?.from?.address}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {newestEmail?.sentAt && (
                                        <div className={
                                            cn("ml-auto text-sm")
                                        }>
                                            {formatDistanceToNow(newestEmail?.sentAt ?? new Date(), {addSuffix: true})}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <ResizablePanel className="flex flex-col">
                                <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto overflow-x-hidden" ref={containerRef}>
                                    {thread.emails.map((email, index) => 
                                        index === thread.emails.length - 1 ? (
                                            <div ref={lastEmail} key={email.id} className='scroll-mt-[25px]'>
                                                <EmailDisplay email={email}/>
                                            </div>
                                        ) : <EmailDisplay key={email.id} email={email}/>
                                    )}
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel className="flex-1 h-full" minSize={24} defaultSize={35}>
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