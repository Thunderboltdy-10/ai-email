import { useTheme } from 'next-themes'
import React from 'react'
import {useRegisterActions} from "kbar"

const useThemeSwitching = () => {
    const {theme, setTheme} = useTheme()
    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
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

    return (
        <div>useThemeSwitching</div>
    )
}

export default useThemeSwitching