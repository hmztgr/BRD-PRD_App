import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, getPlanFromPriceId, getTokenLimit } from '@/lib/stripe'
// import { config } from '@/lib/config' // Temporarily disabled due to zod version issues
import Stripe from 'stripe'

// Disable body parsing for raw webhook payload
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    console.log(`Processing webhook event: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const subscriptionId = subscription.id
    const priceId = subscription.items.data[0]?.price.id

    if (!priceId) {
      console.error('No price ID found in subscription')
      return
    }

    const planInfo = getPlanFromPriceId(priceId)
    if (!planInfo) {
      console.error('Could not determine plan from price ID:', priceId)
      return
    }

    // Find user by Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    })

    if (!user) {
      console.error('User not found for customer:', customerId)
      return
    }

    // Update user subscription
    const tokenLimit = getTokenLimit(planInfo.plan, planInfo.interval)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: planInfo.plan,
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: subscriptionId,
        tokensLimit: tokenLimit,
        billingCycle: planInfo.interval === 'year' ? 'annual' : 'monthly',
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // TODO: Use actual subscription.current_period_end
      }
    })

    // TODO: Record the payment after resolving Stripe type issues

    console.log(`✓ Subscription created for user ${user.email}: ${planInfo.plan} (${planInfo.interval}ly)`)
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id
    const priceId = subscription.items.data[0]?.price.id

    if (!priceId) {
      console.error('No price ID found in subscription update')
      return
    }

    const planInfo = getPlanFromPriceId(priceId)
    if (!planInfo) {
      console.error('Could not determine plan from price ID:', priceId)
      return
    }

    // Find user by subscription ID
    const user = await prisma.user.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    })

    if (!user) {
      console.error('User not found for subscription:', subscriptionId)
      return
    }

    // Update user subscription
    const tokenLimit = getTokenLimit(planInfo.plan, planInfo.interval)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: planInfo.plan,
        subscriptionStatus: subscription.status,
        tokensLimit: tokenLimit,
        billingCycle: planInfo.interval === 'year' ? 'annual' : 'monthly',
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // TODO: Use actual subscription.current_period_end
      }
    })

    console.log(`✓ Subscription updated for user ${user.email}: ${planInfo.plan} (${subscription.status})`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id

    // Find user by subscription ID
    const user = await prisma.user.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    })

    if (!user) {
      console.error('User not found for canceled subscription:', subscriptionId)
      return
    }

    // Revert to free plan
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'free',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
        tokensLimit: getTokenLimit('free'),
        billingCycle: 'monthly',
        subscriptionEndsAt: new Date(Date.now()), // TODO: Use actual subscription.canceled_at
      }
    })

    console.log(`✓ Subscription canceled for user ${user.email}, reverted to free plan`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string
    // const subscriptionId = invoice.subscription as string // TODO: Fix Stripe type issues

    // Find user
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    })

    if (!user) {
      console.error('User not found for payment:', customerId)
      return
    }

    // TODO: Record successful payment after resolving Stripe type issues

    // TODO: Reset monthly token usage for recurring payments

    console.log(`✓ Payment succeeded for user ${user.email}`)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string

    // Find user
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    })

    if (!user) {
      console.error('User not found for failed payment:', customerId)
      return
    }

    // Update subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'past_due',
      }
    })

    // TODO: Record failed payment after resolving Stripe type issues

    // TODO: Send email notification about failed payment

    console.log(`⚠️  Payment failed for user ${user.email}`)
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (!subscriptionId) {
      console.error('No subscription found in checkout session')
      return
    }

    // Find user by customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    })

    if (!user) {
      console.error('User not found for checkout:', customerId)
      return
    }

    // Update user with subscription ID (in case it wasn't set)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscriptionId,
      }
    })

    console.log(`✓ Checkout completed for user ${user.email}`)
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}