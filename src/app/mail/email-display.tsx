"use client"
import useThreads from '@/hooks/use-threads'
import { cn } from '@/lib/utils'
import { api, type RouterOutputs } from '@/trpc/react'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, formatDistanceToNow } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Letter} from "react-letter"
import AvatarIcon from '@/components/avatar-icon'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Forward, MoreVertical, Reply, ReplyAll, Trash2, TrendingUp } from 'lucide-react'
import { useAtom } from 'jotai'
import { currentMessage, replyType } from './thread-display'
import DeleteButton from './delete-button'
import { turndown } from '@/lib/turndown'
import { toast } from 'sonner'
import ReactDOM from "react-dom"
import Attachment from './attachment'
import { attempt } from 'lodash'

type Props = {
    email: RouterOutputs["account"]["getThreads"][0]["emails"][0]
}

export function emailFormat(html: string, dark?: boolean): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const isDarkMode = dark ?? false;

    const DARK = '#0a0a0a';
    const LIGHT = '#fafafa';

    interface RGB {
        r: number;
        g: number;
        b: number;
    }

    function parseColor(color: string): RGB | null {
        if (color.startsWith('#')) {
            let r: number, g: number, b: number;

            if (color.length === 4) {
                // @ts-ignore
                r = parseInt(color[1] + color[1], 16);
                // @ts-ignore
                g = parseInt(color[2] + color[2], 16);
                // @ts-ignore
                b = parseInt(color[3] + color[3], 16);
            } else if (color.length === 7) {
                r = parseInt(color.substr(1, 2), 16);
                g = parseInt(color.substr(3, 2), 16);
                b = parseInt(color.substr(5, 2), 16);
            } else {
                return null;
            }
            return { r, g, b };
        } else if (color.startsWith('rgb')) {
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                return {
                // @ts-ignore
                    r: parseInt(match[1], 10),
                // @ts-ignore
                    g: parseInt(match[2], 10),
                // @ts-ignore
                    b: parseInt(match[3], 10)
                };
            }
        }
        return null;
    }

    function isLightColor(color: string): boolean {
        const rgb = parseColor(color);
        if (!rgb) return false;
        const { r, g, b } = rgb;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5;
    }

    function adjustStyle(style: string): string {
        if (!isDarkMode) return style;

        const properties: string[] = style.split(';').map(prop => prop.trim()).filter(prop => prop);
        const adjustedProperties: string[] = properties.map(prop => {
            const [key, value]: string[] = prop.split(':').map(part => part.trim());
            if (key === 'background' || key === 'background-color') {
                if (isLightColor(value? value : "#fff")) {
                    return `${key}: ${DARK}`;
                }
            } else if (key === 'color') {
                if (!isLightColor(value? value : "#000")) {
                    return `${key}: ${LIGHT}`;
                }
            }
            return prop;
        });
        return adjustedProperties.join('; ');
    }

    function sanitizeElement(el: Element): void {
        const styleAttr = el.getAttribute('style');
        if (styleAttr) {
            const newStyle = adjustStyle(styleAttr);
            el.setAttribute('style', newStyle);
        }

        if (el.hasAttribute('bgcolor')) {
            const bgcolor = el.getAttribute('bgcolor');
            if (bgcolor && isDarkMode && isLightColor(bgcolor)) {
                el.setAttribute('bgcolor', DARK);
            }
        }

        if (el.hasAttribute('color')) {
            const color = el.getAttribute('color');
            if (color && isDarkMode && !isLightColor(color)) {
                el.setAttribute('color', LIGHT);
            }
        }

        Array.from(el.children).forEach(sanitizeElement);
    }

    if (doc.body) {
        sanitizeElement(doc.body);
        if (isDarkMode) {
            doc.body.style.backgroundColor = DARK;
            doc.body.style.color = LIGHT;
        }
    }

    return doc.body?.innerHTML ?? "";
}

const EmailDisplay = ({email}: Props) => {
    const {account, accountId, threadId, setThreadId, refetch} = useThreads()
    const {theme} = useTheme()
    
    const [showDetails, setShowDetails] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [formattedHtml, setFormattedHtml] = React.useState<string>("");

    const [replyOptions, setReplyOptions] = useAtom(replyType)
    const [messageId, setMessageId] = useAtom(currentMessage)

    const isMe = account?.emailAddress === email.from.address
    
    const deleteMail = api.account.deleteMail.useMutation()
    const deleteThread = api.account.deleteThread.useMutation()

    const triggerRef = React.useRef<HTMLDivElement | null>(null)
    const overlayRef = React.useRef<HTMLDivElement | null>(null)

    const [pos, setPos] = React.useState({ left: 0, top: 0 })

    const calculatePosition = React.useCallback(() => {
        const rect = triggerRef.current?.getBoundingClientRect()
        if (!rect) return

        setPos({ left: Math.max(10, rect.left), top: rect.bottom + 10 })
    }, []);

    const openDetails = React.useCallback(() => {
        setShowDetails(true)
        calculatePosition()
    }, [calculatePosition])

    const closeDetails = React.useCallback(() => {
        setShowDetails(false)
    }, [])

    const changeReply = (option: string, id: string) => {
        setReplyOptions(option)
        setMessageId(id)
    }

    const trashEmail = () => {
        setIsDeleting(true)

        try {
            const body = turndown.turndown(email.body ?? email.bodySnippet ?? "")
            
            const remaining = deleteMail.mutateAsync({
                accountId,
                threadId: threadId ?? "",
                messageId: email.id,
                sentAt: email.sentAt.toISOString(),
                body
            })
            remaining.then((result) => {
                if (result === 0) {
                    deleteThread.mutate({
                        accountId,
                        threadId: threadId ?? ""
                    }, {
                        onSuccess: () => {
                            toast.success("Thread moved to trash")
                            setThreadId(null)
                        }
                    })
                } else {
                    toast.success("Email moved to trash")
                }
                setIsDeleting(false)
                refetch()
            })

        } catch (error) {
            toast.error("Error deleting email")
        }

    }

    const rawHtml = React.useMemo(
        () => emailFormat(email.body ?? "", theme === "dark"),
        [email.body, theme]
    );

    const cids = React.useMemo(() => {
        const doc = new DOMParser().parseFromString(rawHtml, "text/html");
        return Array.from(
            new Set(
                Array.from(doc.querySelectorAll<HTMLImageElement>('img[src^="cid:"]'))
                    .map(img => img.getAttribute("src")!.slice(4).replace(/^<|>$/g, ""))
                    .filter(Boolean)
            )
        );
    }, [rawHtml]);

    const { data: attachments , refetch: refetchAttachments, isLoading: attachmentLoading} = api.account.getAttachmentsByCids.useQuery(
        { accountId, messageId: email.id, contentIds: cids },
        { enabled: cids.length > 0 }
    );

    const loadMutation = api.account.setAttachmentContent.useMutation({
        onSuccess: () => {
            refetchAttachments()
        }
    })

    React.useEffect(() => {
        if (!attachments) {
            setFormattedHtml(rawHtml);
            return;
        }

        attachments.forEach(att => {
            if (att.content === null && !attachmentLoading) {
                loadMutation.mutate({
                    accountId,
                    messageId: email.id,
                    attachmentId: att.id
                })
            }
        })

        const allLoaded = attachments.every(att => att.content !== null)

        if (allLoaded) {
            const doc = new DOMParser().parseFromString(rawHtml, "text/html")

            attachments.forEach(att => {
                const img = doc.querySelector(`img[src="cid:${att.contentId}"]`)
                if (img) img.setAttribute("src", `data:${att.mimeType};base64,${att.content}`)
            });
            setFormattedHtml(doc.documentElement.outerHTML)
        }
    }, [attachments, rawHtml])

    React.useLayoutEffect(() => {
        if (!showDetails) return
        const overlay = overlayRef.current
        const trigger = triggerRef.current
        if (!overlay || !trigger) return

        const rect = trigger.getBoundingClientRect()
        const overlayRect = overlay.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight

        let left = rect.left
        if (left + overlayRect.width + 12 > vw) {
            left = Math.max(8, vw - overlayRect.width - 12)
        }

        let top = rect.bottom + 8
        if (top + overlayRect.height + 8 > vh) {
            top = rect.top - overlayRect.height - 8
            if (top < 8) top = 8
        }

        setPos({ left, top })
    }, [showDetails, email])


    return (
        <div className={
            cn("border rounded-md p-4 transition-all hover:translate-x-2", {
                "border-l-gray-900 border-l-4 dark:border-l-white": isMe
            })
        }>
            <div className='flex items-center justify-between gap-2'>
                <div className="flex items-center justify-between gap-2 h-10 min-w-0 w-auto cursor-pointer"
                onMouseOver={openDetails}
                onMouseLeave={closeDetails}>
                    <AvatarIcon name={email.from.name} address={email.from.address} style={"h-8 w-8 shrink-0"}/>
                    <span className='whitespace-nowrap truncate min-w-[70px]'>
                        <div className='text-sm' ref={triggerRef}>
                            {isMe ? "Me" : email.from.name ?? email.from.address}
                        </div>
                        {showDetails && ReactDOM.createPortal(
                            <div
                                ref={overlayRef}
                                onMouseEnter={openDetails}
                                onMouseLeave={closeDetails}
                                style={{
                                    position: "fixed",
                                    left: pos.left,
                                    top: pos.top,
                                    zIndex: 9999,
                                    minWidth: 220,
                                    maxWidth: "min(35vw, 520px)"
                                }}
                                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg rounded-md text-sm text-slate-800 dark:text-slate-100 overflow-hidden"
                            >
                                <div className="p-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-slate-500 dark:text-slate-400">From</div>
                                            <div className="break-words font-medium truncate">
                                                {isMe ? "Me" : email.from.name ?? email.from.address}
                                            </div>
                                            <div className="text-xs break-words text-slate-600 dark:text-slate-300">
                                                {email.from.address}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 ml-2 self-center">
                                            <button
                                                onClick={() => {
                                                    try {
                                                        navigator.clipboard.writeText(email.from.address)
                                                        toast.success("Copied")
                                                    } catch { /* ignore */ }
                                                }}
                                                type='button'
                                                className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 cursor-pointer"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <hr className="my-2 border-slate-100 dark:border-slate-700" />
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">To</div>
                                    <div className="mb-2 break-words">
                                        <span className="text-slate-700 dark:text-slate-200">
                                            {email.to.map((t) => t.address).join(", ")}
                                        </span>
                                    </div>
                                    {email.cc?.length > 0 && (
                                        <>
                                            <hr className="my-2 border-slate-100 dark:border-slate-700" />
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">CC</div>
                                            <div className="mb-1 break-words text-slate-700 dark:text-slate-200">
                                                {email.cc.map((c) => c.address).join(", ")}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>,
                            document.body
                        )}
                    </span>
                </div>
                {email.sentAt && (
                    <div className='text-xs ml-auto text-muted-foreground whitespace-nowrap truncate max-w-[150px]'>
                        {format(new Date(email.sentAt), "PPp")}
                    </div>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="cursor-pointer" variant={"ghost"} size="icon">
                            <MoreVertical className='size-4'/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuItem className={cn(
                                "cursor-pointer group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                replyOptions === "reply" && messageId === email.id
                                    ? "!bg-purple-100 !text-purple-800 hover:!bg-purple-200"
                                    : "!text-purple-600 hover:!bg-purple-100"
                            )}
                            onClick={() => changeReply("reply", email.id)}>
                                <Reply className='size-3.5 text-inherit'/>
                                Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem className={cn(
                                "cursor-pointer group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                replyOptions === "replyall" && messageId === email.id
                                    ? "!bg-purple-200 !text-purple-900 hover:!bg-purple-300"
                                    : "!text-purple-700 hover:!bg-purple-200"
                            )}
                            onClick={() => changeReply("replyall", email.id)}>
                                <ReplyAll className='size-3.5 text-inherit'/>
                                Reply All
                        </DropdownMenuItem>
                        <DropdownMenuItem className={cn(
                                "cursor-pointer group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                replyOptions === "forward" && messageId === email.id
                                    ? "!bg-blue-200 !text-blue-900 hover:!bg-blue-300"
                                    : "!text-blue-700 hover:!bg-blue-200"
                            )}
                            onClick={() => changeReply("forward", email.id)}>
                                <Forward className='size-3.5 text-inherit'/>
                                Forward
                        </DropdownMenuItem>
                        <DeleteButton email={email} isDeleting={isDeleting} trashEmail={trashEmail} title='Delete Email' description='Are you sure you want to delete this email?' inMail={true}/>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="h-4"></div>
            {email.hasAttachments && (
                <div className='flex gap-2 p-2 overflow-y-auto mb-8'>
                    {email.attachments.map((attachment, index) => (
                        <Attachment key={index} attachment={attachment}/>
                    ))}
                </div>
            )}
            <div
            className='rounded-md overflow-auto'
            dangerouslySetInnerHTML={{ __html: formattedHtml || `<div className='pb-4 flex flex-row items-center justify-center text-center text-muted-foreground gap-2'>
            <Loader className='size-4 animate-spin' />
            <div className=''>Loading email...</div>
            </div>` }}
            />
        </div>
    )
}

export default EmailDisplay