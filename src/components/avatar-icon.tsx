import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Props = {
    name: string | null | undefined,
    address: string | undefined,
    style: string
}

const AvatarIcon = ({name, address, style}: Props) => {
    return (
        <Avatar className={style}>
            <AvatarImage alt='avatar'/>
            <AvatarFallback>
                {name? (
                    name?.toUpperCase().split(" ").map(n => n[0]).join("").slice(0, 2)
                ) : (address?.toUpperCase().slice(0, 2)

                )}
            </AvatarFallback>
        </Avatar>
    )
}

export default AvatarIcon