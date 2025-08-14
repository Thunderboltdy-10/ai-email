import useThreads from '@/hooks/use-threads'
import { api, type RouterOutputs } from '@/trpc/react'
import { File, FileImage, FileText, Loader } from 'lucide-react'
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import mammoth from "mammoth";

const Attachment = ({attachment}: {attachment: RouterOutputs["account"]["getThreads"][0]["emails"][0]["attachments"][0]}) => {
    const {accountId, threadId} = useThreads()

    const [docxHtml, setDocxHtml] = React.useState<string | null>(null);
    const utils = api.useContext()

    const setAttachment = api.account.setAttachmentContent.useMutation({
        onSuccess: () => {
            console.log("Attachment content set")
            utils.account.getThreads.invalidate({accountId})
        },
    })

    const renderDocx = async (content: string) => {
        const arrayBuffer = Uint8Array.from(atob(content), c => c.charCodeAt(0)).buffer
        const result = await mammoth.convertToHtml({arrayBuffer})
        return result.value
    }

    const formatBytes = (bytes: number) => {
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    React.useEffect(() => {
        if (attachment.content === null) {
            console.log(attachment)
            setAttachment.mutate({
                accountId,
                messageId: attachment.emailId,
                attachmentId: attachment.id
            })
        }
    }, [attachment, threadId])

    React.useEffect(() => {
        if (attachment.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && attachment.content) {
            renderDocx(attachment.content).then(setDocxHtml);
        }
    }, [attachment]);


    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className='bg-accent h-15 rounded-2xl outline cursor-pointer hover:outline-2'>
                    <div className='flex gap-2 items-center justify-center h-full mx-2'>
                        <div className='flex flex-col items-center'>
                            <div>
                                {attachment.mimeType.includes("image") && <FileImage />}
                                {attachment.mimeType.includes("pdf") && <File />}
                                {attachment.mimeType.includes("document") && <FileText />}
                            </div>
                            <span className='text-xs text-center'>
                                {attachment.mimeType?.split("/")[1]?.split(".").pop()?.slice(0, 10) ?? "unknown"}
                            </span>
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-sm line-clamp-1'>{attachment.name}</span>
                            <span className='text-xs line-clamp-1'>{formatBytes(attachment.size)}</span>
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className='!max-h-[95vh] !max-w-[90vw]'>
                <DialogHeader>
                    <DialogTitle className='text-center line-clamp-1'>{attachment.name}</DialogTitle>
                </DialogHeader>
                <div className='w-full h-full flex items-center justify-center'>
                    {attachment.content ? (
                        attachment.mimeType.includes("image") ? (
                            <img src={`data:${attachment.mimeType};base64,${attachment.content}`} alt={attachment.name} className="h-fit max-h-[85vh] max-w-[85vw]"/>
                        ) : attachment.mimeType.includes("pdf") ? (
                            <embed src={`data:${attachment.mimeType};base64,${attachment.content}#view=FitH&toolbar=1&navpanes=0`} type={attachment.mimeType} className='h-[85vh] w-[85vw]' />
                        ) : attachment.mimeType.includes("document") ? (
                            <div dangerouslySetInnerHTML={{ __html: docxHtml ?? `<div className='pb-4 flex flex-row items-center justify-center text-center text-muted-foreground gap-2'>
                            <Loader className='size-4 animate-spin' />
                            <div className=''>Loading document...</div>
                            </div>` }} className="prose" />
                        ) : (
                            <pre className="whitespace-pre-wrap text-sm max-h-96 overflow-auto">{attachment.content}</pre>
                        )
                    ): (
                        <div className='pb-4 flex flex-row items-center justify-center text-center text-muted-foreground gap-2'>
                            <Loader className='size-4 animate-spin' />
                            <div className=''>Loading attachment...</div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default Attachment