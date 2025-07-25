"use client"
import React from 'react'
import dynamic from 'next/dynamic'
import ThemeToggle from '@/components/theme-toggle'
import { UserButton } from '@clerk/nextjs'

const ComposeButton = dynamic(() => {
    return import ("./compose-button")
}, {
    ssr: false
})

const Mail = dynamic(() => {
    return import("./mail")
}, {
    ssr: false
})

const MailDashboard = () => {
    return (
        <>
            <div className="absolute bottom-4 left-4">
            </div>
            <Mail 
            defaultLayout={[20, 32, 48]}
            defaultCollapsed={false}
            navCollapsedSize={4}
            />
        </>
        
    )
}

export default MailDashboard