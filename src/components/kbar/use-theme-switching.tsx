import { useTheme } from 'next-themes'
import React from 'react'
import {useRegisterActions} from "kbar"
import { useAtom } from 'jotai'
import { themeToggle } from '../theme-toggle'

const useThemeSwitching = () => {
    const {theme, setTheme} = useTheme()
    const [isToggling, setIsToggling] = useAtom(themeToggle)

    const toggleTheme = () => {
        setIsToggling(true)
        setTheme(theme === "light" ? "dark" : "light")
        setTimeout(() => setIsToggling(false), 1000)
    }

    const themeActions = [
        {
            id: "toggleTheme",
            name: "Toggle Theme",
            shortcut: ["t", "t"],
            keywords: "toggle, theme",
            section: "Theme",
            subtitle: "Change theme",
            perform: toggleTheme
        },
        {
            id: "setLightTheme",
            name: "Set Light Theme",
            shortcut: ["t", "l"],
            keywords: "light, theme",
            section: "Theme",
            subtitle: "Change theme to light mode",
            perform: () => setTheme("light")
        },
        {
            id: "setDarkTheme",
            name: "Set Dark Theme",
            shortcut: ["t", "d"],
            keywords: "dark, theme",
            section: "Theme",
            subtitle: "Change theme to dark mode",
            perform: () => setTheme("dark")
        },
    ]

    useRegisterActions(themeActions, [theme])
}

export default useThemeSwitching