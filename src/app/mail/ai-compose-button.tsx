"use client"
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { generateEmail } from './action'
import { readStreamableValue } from 'ai/rsc'
import useThreads from '@/hooks/use-threads'
import { turndown } from '@/lib/turndown'

type Props = {
    isComposing: boolean,
    onGenerate: (token: string) => void
}

const AIComposeButton = (props: Props) => {
    const [open, setOpen] = React.useState(false)
    const [prompt, setPrompt] = React.useState("")
    const {threads, threadId, account} = useThreads()
    const thread = threads?.find(t => t.id === threadId)

    const aiGenerate = async () => {
        let context = ""

        if (!props.isComposing) {
            for (const email of thread?.emails ?? []) {
                const content = `
                    Subject: ${email.subject}
                    From: ${email.from}
                    Sent: ${new Date(email.sentAt).toLocaleString()}
                    Body: ${turndown.turndown(email.body ?? email.bodySnippet ?? "")}
                `
                context +=  content
            }
            context += `
            My name is ${account?.name} and my email is ${account?.emailAddress}
            `
        }

        const {output} = await generateEmail(context, prompt)
        
        for await (const token of readStreamableValue(output)) {
            if (token) {
                props.onGenerate(token)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant={"outline"} onClick={() => setOpen(true)} className='cursor-pointer ai-bg ml-auto'>
                    <Bot className='size-5 text-black' />
                </Button>
            </DialogTrigger>
            <DialogContent className='ai-border'>
                <DialogHeader>
                <DialogTitle className='text-center'>AI Smart Compose</DialogTitle>
                <div className="h-1"></div>
                <DialogDescription className='text-center'>
                    AI will help you compose your email.
                </DialogDescription>
                <div className="h-1"></div>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Enter a prompt'/>
                <div className="h-2"></div>
                <Button onClick={() => {
                    setOpen(false)
                    setPrompt("")
                    aiGenerate()
                }} className='cursor-pointer'>
                    Generate
                </Button>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default AIComposeButton