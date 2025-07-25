"use client"
import { KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch, type Action } from "kbar"
import RenderResults from "./render-results"
import { useLocalStorage } from "usehooks-ts"
import useThemeSwitching from "./use-theme-switching"
import useAccountSwitching from "./use-account-switching"
import useToggleDone from "./use-toggle-done"

export default function KBar({children}: {children: React.ReactNode}) {
    const [tab, setTab] = useLocalStorage("email-tab", "inbox")
    const [done, setDone] = useLocalStorage("email-done", false)

    const actions: Action[] = [
        {
            id: "inboxAction",
            name: "Inbox",
            shortcut: ["n", "i"],
            keywords: "inbox",
            section: "Navigation",
            subtitle: "View your inbox",
            perform: () => {
                setTab("inbox")
            }
        },
        {
            id: "draftsAction",
            name: "Drafts",
            shortcut: ["n", "d"],
            keywords: "drafts",
            section: "Navigation",
            subtitle: "View your drafts",
            perform: () => {
                setTab("draft")
            }
        },
        {
            id: "sentAction",
            name: "Sent",
            shortcut: ["n", "s"],
            keywords: "sent",
            section: "Navigation",
            subtitle: "View your sent",
            perform: () => {
                setTab("sent")
            }
        },
        {
            id: "pendingAction",
            name: "See Done",
            shortcut: ["e", "d"],
            keywords: "done",
            section: "Navigation",
            subtitle: "View your done emails",
            perform: () => {
                setDone(true)
            }
        },
        {
            id: "doneAction",
            name: "See Pending",
            shortcut: ["e", "i"],
            keywords: "pending, undone, not done",
            section: "Navigation",
            subtitle: "View your pending emails",
            perform: () => {
                setDone(false)
            },
        },
    ]

    return <KBarProvider actions={actions}>
        <ActualComponent>
            {children}
        </ActualComponent>
    </KBarProvider>
}

const ActualComponent = ({children}: {children: React.ReactNode}) => {
    useThemeSwitching()
    useAccountSwitching()
    useToggleDone()

    return <>
        <KBarPortal>
            <KBarPositioner className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm scrollbar-hide !p-0 z-[999]">
                <KBarAnimator className="max-w-[600px] !mt-64 w-full bg-white dark:bg-gray-800 text-foreground dark:text-gray-200 shadow-lg border dark:border-gray-700 rounded-lg overflow-hidden relative !-translate-y-12">
                    <div className="bg-white dark:bg-gray-800">
                        <div className="border-x-0 border-b-2 dark:border-gray-700">
                            <KBarSearch className="py-4 px-6 text-lg w-full bg-white dark:bg-gray-800 outline-none border-none focus:outline-none focus:ring-0 focus:ring-offset-0"/>
                        </div>
                        <RenderResults />
                    </div>
                </KBarAnimator>
            </KBarPositioner>
        </KBarPortal>
        {children}
    </>
}