"use client"
import { useTheme } from 'next-themes'
import React from 'react'
import { Button } from './ui/button'
import { MoonIcon, SunIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { atom, useAtom } from 'jotai'

export const themeToggle = atom(false)

const ThemeToggle = ({collapsed} : {collapsed?: boolean}) => {
    const {theme, setTheme} = useTheme()
    const [isToggling, setIsToggling] = useAtom(themeToggle)


    const toggleTheme = () => {
        setIsToggling(true)
        setTheme(theme === "light" ? "dark" : "light")
        setTimeout(() => setIsToggling(false), 1000)
    }

    return (
        <Button className="cursor-pointer justify-between" variant={"outline"} onClick={toggleTheme}>
            <SunIcon className={`h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:-rotate-0 dark:scale-100 ${isToggling ? "animate-spin" : ""}`} size="icon" />
            <MoonIcon className={`absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0 ${isToggling ? "animate-spin" : ""}`} size="icon" />
            {!collapsed && <>Toggle Theme</>}
        </Button>
    )
}

export default ThemeToggle