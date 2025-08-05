import React from "react"
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Trash2 } from 'lucide-react'
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { openSync } from "fs"

type Props = {
    thread?: any,
    email?: any,
    isDeleting: boolean,
    trashEmail: () => void,
    title: string,
    description: string,
    inMail: boolean
}

const DeleteButton = ({thread, isDeleting, trashEmail, title, description,  inMail}: Props) => {
    const [open, setOpen] = React.useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {inMail ? (
                    <DropdownMenuItem className={cn(
                        "cursor-pointer group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        open
                            ? "!bg-red-100 !text-red-800 hover:!bg-red-200"
                            : "!text-red-600 hover:!bg-red-100"
                    )}
                    disabled={isDeleting}
                    onClick={(e) => {
                        e.preventDefault()
                        setOpen(true)
                    }}>
                            <Trash2 className='size-3.5 text-inherit'/>
                            Delete
                    </DropdownMenuItem>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                            variant={"ghost"}
                            size="icon"
                            disabled={!thread || isDeleting}
                            onClick={() => setOpen(true)}
                            className={cn(
                                "cursor-pointer",
                                open
                                    ? "!bg-red-100 !text-red-800 hover:!bg-red-200"
                                    : "!text-red-600 hover:!bg-red-100"
                            )}>
                                <Trash2 className='size-4'/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle className='text-center'>{title}</DialogTitle>
                <div className="h-1"></div>
                <DialogDescription className="text-center">
                    {description}
                </DialogDescription>
                <div className="h-2"></div>
                <div className="flex gap-2">
                    <Button onClick={() => {
                            trashEmail()
                            setOpen(false)
                        }} className="flex-1 cursor-pointer">
                        Delete
                    </Button>
                    <Button onClick={() => setOpen(false)} variant="outline" className="flex-1 cursor-pointer">
                        Cancel
                    </Button>
                </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteButton