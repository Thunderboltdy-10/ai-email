"use client"
import useThreads from '@/hooks/use-threads'
import { cn } from '@/lib/utils'
import type { RouterOutputs } from '@/trpc/react'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import {Letter} from "react-letter"
import AvatarIcon from '@/components/avatar-icon'
import { useTheme } from 'next-themes'

type Props = {
    email: RouterOutputs["account"]["getThreads"][0]["emails"][0]
}

const DARK = '#0a0a0a'
const LIGHT = '#fafafa'

export function emailFormat(html: string, dark?: boolean): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function sanitizeElement(el: Element): void {
        const styleAttr = el.getAttribute('style');
        if (styleAttr) {
        let newStyle = styleAttr;

        newStyle = newStyle.replace(
            /background(-color)?\s*:\s*(#fff(f)?|white|#eeeeee|#f[0-9a-f]{5,6})[^;]*;?/gi,
            `background-color: ${dark? DARK : LIGHT };`
        );

        newStyle = newStyle.replace(
            /color\s*:\s*(black|#000000)[^;]*;?/gi,
            `color: ${dark? LIGHT : DARK };`
        );

        el.setAttribute('style', newStyle);
        }

        if (el.hasAttribute('bgcolor')) {
        el.setAttribute('bgcolor', dark? DARK : LIGHT );
        }

        if (el.hasAttribute('color')) {
        el.setAttribute('color', dark? LIGHT : DARK );
        }

        Array.from(el.children).forEach(sanitizeElement);
    }

    if (doc.body) {
        sanitizeElement(doc.body);

        doc.body.style.backgroundColor = dark? DARK : LIGHT ;
        doc.body.style.color = dark? LIGHT : DARK ;
    }

    doc.querySelectorAll('style').forEach(styleTag => {
        styleTag.remove();
    });

    return doc.documentElement.outerHTML;
}



const EmailDisplay = ({email}: Props) => {
    const {account} = useThreads()
    const {theme} = useTheme()

    const isMe = account?.emailAddress === email.from.address

    return (
        <div className={
            cn("border rounded-md p-4 transition-all hover:translate-x-2", {
                "border-l-gray-900 border-l-4 dark:border-l-white": isMe
            })
        }>
            <div className='flex items-center justify-between gap-2'>
                <div className="flex items-center justify-between gap-2 h-10 w-10">
                    {!isMe && (
                        <AvatarIcon name={email.from.name} address={email.from.address} style={"h-10 w-10"}/>
                    )}
                    <span className='whitespace-nowrap'>
                        {isMe ? "Me" : email.from.address}
                    </span>
                </div>
                <div>
                </div>
                <p className='text-sm text-muted-foreground'>
                    {formatDistanceToNow(email.sentAt ?? new Date(), {
                        addSuffix: true
                    })}
                </p>
            </div>
            <div className="h-4"></div>
            <Letter html={emailFormat(email?.body ?? "", theme === "dark")} className='rounded-md'/>
        </div>
    )
}

export default EmailDisplay