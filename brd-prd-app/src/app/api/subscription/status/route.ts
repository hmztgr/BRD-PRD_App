import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { retrieveSubscription } from '@/lib/stripe'
import Stripe from 'stripe'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        tokensUsed: true,
        tokensLimit: true,
        billingCycle: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let stripeSubscription: Stripe.Subscription | null = null
    if (user.stripeSubscriptionId) {
      try {
        stripeSubscription = await retrieveSubscription(user.stripeSubscriptionId) as Stripe.Subscription
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error)
        // Continue without Stripe data if there's an error
      }
    }

    // Calculate usage percentage
    const usagePercentage = user.tokensLimit > 0 ? 
      Math.round((user.tokensUsed / user.tokensLimit) * 100) : 0

    // Determine if subscription is active
    const isActive = user.subscriptionStatus === 'active' && 
      (!user.subscriptionEndsAt || user.subscriptionEndsAt > new Date())

    // Calculate days until renewal/expiry
    let daysUntilRenewal = null
    if (user.subscriptionEndsAt) {
      const diffTime = user.subscriptionEndsAt.getTime() - Date.now()
      daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const subscriptionData = {
      user: {
        id: user.id,
        email: user.email,
        memberSince: user.createdAt,
      },
      subscription: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        billingCycle: user.billingCycle,
        isActive,
        endsAt: user.subscriptionEndsAt,
        daysUntilRenewal,
        hasStripeCustomer: !!user.stripeCustomerId,
        hasActiveSubscription: !!user.stripeSubscriptionId,
      },
      usage: {
        tokensUsed: user.tokensUsed,
        tokensLimit: user.tokensLimit,
        tokensRemaining: Math.max(0, user.tokensLimit - user.tokensUsed),
        usagePercentage,
        isOverLimit: user.tokensUsed > user.tokensLimit,
      },
      billing: null, // TODO: Implement proper Stripe subscription details
    }

    return NextResponse.json(subscriptionData)

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}