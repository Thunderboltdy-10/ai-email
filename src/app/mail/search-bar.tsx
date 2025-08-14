"use client"
import { Input } from '@/components/ui/input'
import useThreads from '@/hooks/use-threads'
import { atom, useAtom } from 'jotai'
import { Filter, Loader, Megaphone, MessageSquareDot, Search, X } from 'lucide-react'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'

export const searchValueAtom = atom("")
export const isSearchingAtom = atom(false)
export const filtersAtom = atom<string[]>([])

const filterOptions = [
    {
        value: "Primary",
        label: "important"
    },
    {
        value: "Unread",
        label: "unread"
    },
    {
        value: "Promotions",
        label: "promotions"
    }
]

const SearchBar = () => {
    const [searchValue, setSearchValue] = useAtom(searchValueAtom)
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom)

    const [filters, setFilters] = useLocalStorage("email-filters", ["important"])
    const [showFilters, setShowFilters] = React.useState(false)

    const {refetch, isFetching} = useThreads()

    const filterRef = React.useRef<HTMLDivElement | null>(null)

    const handleBlur = () =>  {
        if (searchValue  !== "") return
        setIsSearching(false)
    }

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as HTMLElement) && showFilters && !(event.target as HTMLElement).closest("#filter-button")) {
                setShowFilters(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    })

    return (
        <div className='relative m-4'>
            <Search className='absolute left-2 top-2.5 size-4 text-muted-foreground' />
            <Input
            placeholder='Search...'
            className='pl-8'
            value={searchValue}
            onChange={e => {
                setSearchValue(e.target.value)
                if (e.target.value === "") {
                    setIsSearching(false)
                } else {
                    setIsSearching(true)
                }
            }}
            onFocus={() => {
                if (searchValue !== "") {
                    setIsSearching(true)
                }
            }}
            onBlur={() => handleBlur()}
            />
            <div className='absolute right-1.5 top-2 flex items-center'>
                {isFetching && <Loader className='size-4 animate-spin text-gray-400 mr-2' />}
                <button className={`rounded-sm hover:bg-gray-400/20 cursor-pointer p-1 ${showFilters ? "bg-gray-400/20" : ""}`} type='button' aria-label='clear' id='filter-button'
                onClick={() => {
                    setShowFilters(!showFilters)
                }}>
                    <Filter className="size-4 text-gray-400" />
                </button>
                <button className='rounded-sm hover:bg-gray-400/20 cursor-pointer p-1' type='button' aria-label='clear'
                onClick={() => {
                    setSearchValue("")
                    setIsSearching(false)
                }}>
                    <X className='size-4 text-gray-400' />
                </button>
            </div>
            <div className={`absolute left-0 top-full mt-2 z-10 w-full rounded-md border bg-accent shadow-lg transition-all duration-300 ${showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`} ref={filterRef}>
                <p className='p-2 text-sm text-muted-foreground'>Filters</p>
                <div className='flex gap-5 flex-wrap p-2'>
                    {filterOptions.map((filter) => (
                        <label className='flex gap-1 text-sm text-muted-foreground cursor-pointer' key={filter.value}>
                            <input type="checkbox" checked={filters.includes(filter.label)} aria-label='filter' onChange={() => {
                                setFilters(prev => prev.includes(filter.label) ? prev.filter(f => f !== filter.label) : [...prev, filter.label])
                                refetch()
                            }}/>
                            {filter.value}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SearchBar