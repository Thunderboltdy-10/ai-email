"use client"
import useThreads from '@/hooks/use-threads'
import { cn } from '@/lib/utils'
import type { RouterOutputs } from '@/trpc/react'
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
import { MoreVertical } from 'lucide-react'

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

    // Preserve <style> tags instead of removing them
    return doc.documentElement.outerHTML;
}



const EmailDisplay = ({email}: Props) => {
    const {account} = useThreads()
    const {theme} = useTheme()
    
    const [showDetails, setShowDetails] = React.useState(false)

    const isMe = account?.emailAddress === email.from.address

    return (
        <div className={
            cn("border rounded-md p-4 transition-all hover:translate-x-2", {
                "border-l-gray-900 border-l-4 dark:border-l-white": isMe
            })
        }>
            <div className='flex items-center justify-between gap-2'>
                <div className="flex items-center justify-between gap-2 h-10 min-w-0 cursor-pointer"
                onMouseOver={() => setShowDetails(true)}
                onMouseLeave={() => setShowDetails(false)}>
                    <AvatarIcon name={email.from.name} address={email.from.address} style={"h-10 w-10 shrink-0"}/>
                    <span className='whitespace-nowrap truncate min-w-[70px]'>
                        {isMe ? "Me" : email.from.address}
                        {showDetails && (
                            <div className="absolute w-auto top-8 -ml-1 h-auto bg-accent m-5 rounded-md max-w-[35vw] flex flex-col break-word text-sm border border-gray-300"
                            onMouseOver={() => setShowDetails(true)}>
                                <div className='p-2 flex gap-1'>
                                    <span className='min-w-[50px]'>From: </span>
                                    {email.from.address}
                                </div>
                                <div className='p-2 flex gap-1'>
                                    <span className='min-w-[50px]'>To: </span>
                                    <span>{email.to.map(to => to.address).join(", ")}</span>
                                </div>
                                <div className='p-2 flex gap-1'>
                                    <span className='min-w-[50px]'>CC: </span>
                                    <span>{email.cc.map(cc => cc.address).join(", ")}</span>
                                </div>
                            </div>
                        )}
                    </span>
                </div>
                {email.sentAt && (
                    <div className='ml-auto text-sm text-muted-foreground whitespace-nowrap truncate max-w-[150px]'>
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
                        <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                        <DropdownMenuItem>Star thread</DropdownMenuItem>
                        <DropdownMenuItem>Add label</DropdownMenuItem>
                        <DropdownMenuItem>Mute thread</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="h-4"></div>
            <Letter html={emailFormat(email?.body ?? "", theme === "dark")} className='rounded-md overflow-auto'/>
        </div>
    )
}

export default EmailDisplay