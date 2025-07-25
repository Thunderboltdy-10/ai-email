"use client"
import React from 'react'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import EmailEditor from './email-editor'
import { api } from '@/trpc/react'
import useThreads from '@/hooks/use-threads'
import { toast } from 'sonner'

const ComposeButton = ({collapsed}: {collapsed?: boolean}) => {
    const [toValues, setToValues] = React.useState<{label: React.JSX.Element, value: string}[]>([])
    const [ccValues, setCcValues] = React.useState<{label: React.JSX.Element, value: string}[]>([])

    const [subject, setSubject] = React.useState<string>("")
    const [open, setOpen] = React.useState(false)

    const sendEmail = api.account.sendEmail.useMutation()
    const {account} = useThreads()

    const handleSend = async (value: string) => {
        if (!account) return

        sendEmail.mutate({
            accountId: account.id,
            threadId: undefined,
            body: value,
            from: {name: account?.name ?? "Me", address: account.emailAddress ?? "me@example.com"},
            to: toValues.map(to => ({name: to.value, address: to.value})),
            cc: ccValues.map(cc => ({name: cc.value, address: cc.value})),
            replyTo: {name: account?.name ?? "Me", address: account.emailAddress ?? "me@example.com"},
            subject: subject,
            inReplyTo: undefined
        }, {
            onSuccess: () => {
                toast.success("Email sent!")
                setOpen(false)
            },
            onError: (error) => {
                console.error(error)
                toast.error("Error sending email")
            }
        })
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button className='cursor-pointer'>
                    <Pencil className='size-4'/>
                    {!collapsed && <>Compose</>}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Compose Email</DrawerTitle>
                </DrawerHeader>
                <EmailEditor
                toValues={toValues}
                setToValues={setToValues}
                ccValues={ccValues}
                setCcValues={setCcValues}
                subject={subject}
                setSubject={setSubject}
                to={toValues.map(to => to.value)}
                defaultToolbarExpanded={true}
                handleSend={handleSend}
                isSending={sendEmail.isPending}
                />
            </DrawerContent>
        </Drawer>
    )
}

export default ComposeButton