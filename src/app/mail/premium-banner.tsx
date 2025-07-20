import { FREE_CREDITS_PER_DAY } from '@/constants'
import React from 'react'
import StripeButton from './stripe-button'
import { getSubscriptionStatus } from '@/lib/stripe-actions'
import { api } from '@/trpc/react'
import useThreads from '@/hooks/use-threads'

const PremiumBanner = () => {
    const [isSubscribed, setIsSubscribed] = React.useState(false)

    const {accountId} = useThreads()
    const {data} = api.account.getChatbotInteraction.useQuery({
        accountId
    })

    React.useEffect(() => {
        (async () => {
            const isSubscribed = await getSubscriptionStatus()
            setIsSubscribed(isSubscribed)
        })()
    }, [])

    if (!isSubscribed) return <div className='bg-gray-900 relative p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4'>
        <img src="/bot.webp" aria-label="bot-img" className='md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto' />
        <div>
            <div className="flex items-center gap-2">
                <h1 className='text-white text-xl font-bold'>Basic Plan</h1>
                <p className='text-gray-400 text-sm md:max-w-full'>
                    {data?.remainingCredits} / {FREE_CREDITS_PER_DAY} AI messages remaining
                </p>
                <div className="h-4"></div>
            </div>
            <p className='text-gray-400 text-sm md:max-w-[calc(100%-150px)]'>
                Upgrate to pro to ask unlimited questions
            </p>
            <div className="h-4"></div>
            <StripeButton />
        </div>
    </div>

    if (isSubscribed) return <div className='bg-gray-900 relative p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4'>
        <img src="/bot.webp" aria-label="bot-img" className='md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto' />
        <div>
            <div className="flex items-center gap-2">
                <h1 className='text-white text-xl font-bold'>Premium Plan</h1>
                <div className="h-4"></div>
            </div>
            <p className='text-gray-400 text-sm md:max-w-[calc(100%-70px)]'>
                Ask as many questions as you want!
            </p>
            <div className="h-4"></div>
            <StripeButton />
        </div>
    </div>
}

export default PremiumBanner