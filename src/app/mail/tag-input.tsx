import AvatarIcon from '@/components/avatar-icon'
import useThreads from '@/hooks/use-threads'
import { api } from '@/trpc/react'
import React from 'react'
import Select from "react-select"
import Creatable from "react-select/creatable"

type Props = {
    placeholder: string
    label: string

    onChange: (values: {label: React.JSX.Element, value: string, data: {name: string | null, address: string}}[]) => void
    value: {label: React.JSX.Element, value: string, data: {name: string | null, address: string}}[]
}

const TagInput = ({placeholder, label, onChange, value}: Props) => {
    const {accountId} = useThreads()
    const {data: suggestions} = api.account.getSuggestions.useQuery({
        accountId
    })
    const [inputValue, setInputValue] = React.useState("")

    const options = suggestions?.map(suggestion => ({
        label: (
            <span className='flex items-center gap-2'>
                <AvatarIcon name={suggestion.name} address={suggestion.address} style={"h-8 w-8 text-sm"}/>
                {suggestion.address}
            </span>
        ),
        value: suggestion.address,
        data: {name: suggestion.name, address: suggestion.address}
    }))

    return (
        <div className='border rounded-md flex items-center'>
            <span className='ml-3 text-sm text-gray-500 dark:text-white'>
                {label}
            </span>
            <Select
            onInputChange={setInputValue}
            value={value}
            // @ts-ignore
            onChange={onChange}
            className='w-full flex-1'
            // @ts-ignore
            options={inputValue != "" && !options?.some(option => option.value.includes(inputValue)) ? options?.concat({
                label: (
                    <span className='flex items-center gap-2'>
                        <AvatarIcon name={inputValue} address={inputValue} style={"h-8 w-8 text-sm"}/>
                        {inputValue}
                    </span>
                ),
                value: inputValue,
                data: {name: inputValue, address: inputValue}
            })
                : options
            }
            placeholder={placeholder}
            isMulti
            classNames={{
                control: () => {
                    return '!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none dark:!bg-transparent'
                },
                input: () => {
                    return "dark:!text-gray-300"
                },
                multiValue: () => {
                    return "text-gray-900 !bg-blue-100 dark:!bg-gray-900"
                },
                multiValueLabel: () => {
                    return "!text-gray-900 dark:!text-white dark:!bg-gray-900 rounded-md"
                },
                option: () => {
                    return "dark:!text-white dark:!bg-gray-700 dark:hover:!bg-gray-900 !cursor-pointer"
                },
                menuList: () => {
                    return "!p-0"
                }
            }}
            />
        </div>
    )
}

export default TagInput