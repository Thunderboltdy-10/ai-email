"use client"
import React, { useRef } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AccountSwitcher from './account-switcher'
import Sidebar from './sidebar'
import ThreadList from './thread-list'
import ThreadDisplay from './thread-display'
import SearchBar from './search-bar'
import AskAI from './ask-ai'
import { useLocalStorage } from 'usehooks-ts'
import useThreads from '@/hooks/use-threads'
import type { ImperativePanelHandle, Panel } from 'react-resizable-panels'
import { Button } from '@/components/ui/button'
import { RotateCw } from 'lucide-react'
import { api } from '@/trpc/react'
import { dataTagErrorSymbol } from '@tanstack/react-query'

type Props = {
    defaultLayout: number[]
    navCollapsedSize: number
    defaultCollapsed: boolean
}

const Mail = ({defaultLayout = [20, 32, 48], navCollapsedSize, defaultCollapsed}: Props) => {
    const {accountId, refetch} = useThreads()
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [done, setDone] = useLocalStorage("email-done", false)

    const [isRefreshing, setIsRefreshing] = React.useState(false)

    const collapsableRef = useRef<ImperativePanelHandle | null>(null)

    const changeDone = (value: boolean) => {
        if (done != value) {
            setDone(value)
        }
    }

    const refresh = () =>{
        setIsRefreshing(true)
        refetch()
        setTimeout(() => setIsRefreshing(false), 8000)
    }

    React.useEffect(() => {
        const handler = () => setIsCollapsed(window.innerWidth < 1000)
        handler()
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])

    React.useEffect(() => {
        if (isCollapsed) {
            collapsableRef.current?.collapse()
        } else {
            // @ts-ignore
            collapsableRef.current?.resize(defaultLayout[0])
        }
    }, [isCollapsed])

    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup direction='horizontal' className='items-stretch h-full min-h-screen'>
                <ResizablePanel
                ref={collapsableRef}
                defaultSize={defaultLayout[0]}
                collapsedSize={navCollapsedSize}
                collapsible={true}
                minSize={18}
                maxSize={40}
                onCollapse={() => {
                    setIsCollapsed(true)
                }}
                onResize={() => {   
                    setIsCollapsed(false)
                }}
                className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}>
                    <div className='flex flex-col h-full flex-1'>
                        <div className={cn('flex h-[52px] items-center justify-between', isCollapsed? "h-[52px]" : "px-2")}>
                            <AccountSwitcher isCollapsed={isCollapsed} />
                        </div>
                        <Separator />
                        <Sidebar isCollapsed={isCollapsed}/>
                        <div className="flex-1"></div>
                        <AskAI isCollapsed={isCollapsed}/>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                defaultSize={defaultLayout[1]}
                minSize={30}>
                    <Tabs defaultValue='inbox' value={done? "done" : "inbox"}>
                        <div className="flex items-center px-4 pt-2">
                            <h1 className='text-xl font-bold pl-2'>Inbox</h1>
                            <TabsList className='ml-auto'>
                                <TabsTrigger value='inbox' className='text-zinc-600 dark:text-zinc-200 cursor-pointer' onClick={() => changeDone(false)}>
                                    Inbox
                                </TabsTrigger>
                                <TabsTrigger value='done' className='text-zinc-600 dark:text-zinc-200 cursor-pointer' onClick={() => changeDone(true)}>
                                    Done
                                </TabsTrigger>
                            </TabsList>
                            <Button variant="ghost" className={`ml-2 cursor-pointer ${isRefreshing? "animate-spin" : ""}`} onClick={() => refresh()} disabled={isRefreshing}>
                                <RotateCw className='size-4 text-gray-400' />
                            </Button>
                        </div>
                        <Separator />
                        <SearchBar />
                        <TabsContent value='inbox'>
                            <ThreadList />
                        </TabsContent>
                        <TabsContent value='done'>
                            <ThreadList right />
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle withHandle/>
                <ResizablePanel
                defaultSize={defaultLayout[2]}
                minSize={30}>
                    <ThreadDisplay />
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    )
}

export default Mail