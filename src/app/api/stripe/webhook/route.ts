import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { sub } from "date-fns";
import { headers } from "next/headers";
import type Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get("Stripe-Signature") as string

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        )
    } catch (error) {
        return new Response("Webhook error", { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session
    console.log("received stripe event", event.type, {status: 200})

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            {
                expand: ["items.data.price.product"]
            }
        )

        if (!session?.client_reference_id) {
            return new Response("No client reference id", { status: 400 }) 
        }

        const item = subscription.items.data[0]
        if (!item) {
            return new Response("No item", { status: 400 })
        }

        const plan = item.price
        if (!plan) {
            return new Response("No plan", { status: 400 })
        }

        await db.stripeSubscription.create({
            data: {
                userId: session.client_reference_id,
                priceId: plan.id,
                customerId: subscription.customer as string,
                currentPeriodEnd: new Date(item.current_period_end * 1000),
                subscriptionId: subscription.id
            }
        })

        return new Response("Webhook received", { status: 200 })
    }

    if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            {
                expand: ["items.data.price.product"]
            }
        )

        const item = subscription.items.data[0]
        if (!item) {
            return new Response("No item", { status: 400 })
        }

        const plan = item.price
        if (!plan) {
            throw new Error('No plan found for this subscription.')
        }

        await db.stripeSubscription.update({
            where: {
                subscriptionId: subscription.id
            },
            data: {
                currentPeriodEnd: new Date(item.current_period_end * 1000),
                priceId: plan.id,
            }
        })

        return new Response("Webhook received", { status: 200 })
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = await stripe.subscriptions.retrieve(
            session.id as string
        )

        const existingSubscription = await db.stripeSubscription.findUnique({
            where: {
                subscriptionId: session.id as string
            }
        })
        if (!existingSubscription) {
            return new Response("No existing subscription", { status: 200 })
        }

        const item = subscription.items.data[0]
        if (!item) {
            return new Response("No item", { status: 400 })
        }

        await db.stripeSubscription.update({
            where: {
                subscriptionId: session.id as string
            },
            data: {
                updatedAt: new Date(),
                currentPeriodEnd: new Date(item.current_period_end * 1000),
            }
        })
        
        return new Response("Webhook received", { status: 200 })
    }

    return new Response("Webhook received", { status: 200 })
}