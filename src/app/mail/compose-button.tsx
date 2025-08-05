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
    const [toValues, setToValues] = React.useState<{label: React.JSX.Element, value: {name: string | null, address: string}}[]>([])
    const [ccValues, setCcValues] = React.useState<{label: React.JSX.Element, value: {name: string | null, address: string}}[]>([])

    const [subject, setSubject] = React.useState<string>("")
    const [open, setOpen] = React.useState(false)

    const sendEmail = api.account.sendEmail.useMutation()
    const {account} = useThreads()

    const handleSend = async (value: string) => {
        if (!account) return

        if (toValues.length < 1) {
            toast.error("Please select at least one recipient")
            return
        }

        sendEmail.mutate({
            accountId: account.id,
            threadId: undefined,
            body: value,
            from: {name: account.name, address: account.emailAddress},
            to: toValues.map(to => ({name: to.value.name ?? to.value.address, address: to.value.address})),
            cc: ccValues.map(cc => ({name: cc.value.name ?? cc.value.address, address: cc.value.address})),
            
            replyTo: {name: account.name, address: account.emailAddress},
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

        setToValues([])
        setCcValues([])
        setSubject("")
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

                to={[...toValues.map(to => to.value.address), ...ccValues.map(cc => cc.value.address)]}

                defaultToolbarExpanded={true}
                handleSend={handleSend}
                isSending={sendEmail.isPending}
                />
            </DrawerContent>
        </Drawer>
    )
}

export default ComposeButton