import React from 'react'
import {useRegisterActions} from "kbar"
import useThreads from "@/hooks/use-threads"
import { useAtom } from "jotai"
import { startToggle } from "@/app/mail/thread-display"

const useToggleDone = () => {
    const {threadId} = useThreads()

    const [toggle, setToggle] = useAtom(startToggle)

    const changeDone = () => {
        if (!threadId) return
        setToggle(true)
    }

    const doneAction = [
    {
        id: "toggleDoneAction",
        name: "Toggle Done",
        shortcut: ["d", "d"],
        keywords: "mark, done, pending",
        section: "Actions",
        subtitle: "Toggle between done and pending",
        perform: changeDone
    }]

    useRegisterActions(doneAction, [threadId])
}

export default useToggleDone