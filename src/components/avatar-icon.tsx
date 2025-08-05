import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { colors } from 'node_modules/react-select/dist/declarations/src/theme'

type Props = {
    name: string | null | undefined,
    address: string | undefined,
    style: string
}

const AvatarIcon = ({name, address, style}: Props) => {
    const color = hashToHSL(name ?? address ?? "")
    
    function hashString(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        return Math.abs(hash)
    }

    function hashToHSL(str: string): string {
        const hash = hashString(str)
        const hue = hash % 360
        const saturation = 50 + (hash % 10)
        const lightness = 80 + (hash % 10)   
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
                
    return (
        <Avatar className={style}>
            <AvatarImage alt='avatar'/>
            <AvatarFallback style={{backgroundColor: color}} className='text-black'>
                {name? (
                    name.toUpperCase().split(" ").map(n => n[0]).join("").slice(0, 2)
                ) : (address?.toUpperCase().slice(0, 2)

                )}
            </AvatarFallback>
        </Avatar>
    )
}

export default AvatarIcon