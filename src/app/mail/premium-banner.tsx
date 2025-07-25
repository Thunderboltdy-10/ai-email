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

    return <div className='bg-gray-900 relative p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4'>
        <img src="/bot.webp" aria-label="bot-img" className='md:absolute md:-right-12 h-[180px] w-auto' />
        <div>
            <div className="flex items-center gap-2">
                <h1 className='text-white text-xl font-bold w-full'>
                    {isSubscribed ? "Pro Plan" : "Basic Plan"}
                </h1>
                {!isSubscribed && (
                    <p className='text-gray-400 text-sm w-full'>
                        {data?.remainingCredits} / {FREE_CREDITS_PER_DAY} remaining
                    </p>
                )}
                <div className="h-4"></div>
            </div>
            <p className='text-gray-400 text-sm md:max-w-[calc(100%-80px)]'>
                {isSubscribed ? "Ask as many questions as you want!" : "Upgrate to pro to ask unlimited questions"}
            </p>
            <div className="h-4"></div>
            <StripeButton />
        </div>
    </div>
}

export default PremiumBanner