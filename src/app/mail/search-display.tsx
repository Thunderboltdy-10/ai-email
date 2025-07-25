import { useAtom } from 'jotai'
import React from 'react'
import { isSearchingAtom, searchValueAtom } from './search-bar'
import { api } from '@/trpc/react'
import { useDebounceValue } from 'usehooks-ts'
import useThreads from '@/hooks/use-threads'
import DOMPurify from 'dompurify'
import { format } from 'date-fns'

const SearchDisplay = () => {
    const [searchValue] = useAtom(searchValueAtom)
    const search = api.account.searchEmails.useMutation()
    const [debouncedSearchValue] = useDebounceValue(searchValue, 800)

    const {accountId, setThreadId} = useThreads()
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom)

    React.useEffect(() => {
        if (!accountId) return

        search.mutate({
            accountId,
            query: debouncedSearchValue
        })
    }, [debouncedSearchValue, accountId])

    const searchToThread = (id: string) => {
        setThreadId(id)
        setIsSearching(false)
    }

    return (
        <div className="p-4 max-h-[calc(100vh-50px)] overflow-y-auto">
            <div className='flex items-center gap-2 mb-4'>
                <h2 className='text-gray-600 text-sm dark:text-gray-400'>
                    Showing {search.data?.hits.length} search results for &quot;{searchValue}&quot;:
                </h2>
            </div>
            {search.data?.hits.length === 0 ? (<>
                <p>No results found</p>
            </>) : <>
                <ul  className='flex flex-col gap-2'>
                    {search.data?.hits.map(hit => (
                        <li key={hit.id} className='border list-none rounded-md p-4 hover:bg-gray-100 cursor-pointer transition-all dark:hover:bg-gray-900' onClick={() => searchToThread(hit.document.threadId)}>
                            <div className="flex flex-row">
                                <h3 className='text-base font-medium'>
                                    {hit.document.subject}
                                </h3>
                                <div className='ml-auto text-xs text-muted-foreground'>
                                    {format(new Date(hit.document.sentAt), "PPp")}
                                </div>
                            </div>
                            <p className='text-sm text-gray-500'>
                                From: {hit.document.from}
                            </p>
                            <p className='text-sm text-gray-500'>
                                To: {hit.document.to.join(", ")}
                            </p>
                            <p className='text-sm mt-2' dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(hit.document.rawBody, {USE_PROFILES: {html: true}})
                            }}>

                            </p>
                        </li>
                    ))}
                </ul>
            </>}
        </div>
    )
}

export default SearchDisplay