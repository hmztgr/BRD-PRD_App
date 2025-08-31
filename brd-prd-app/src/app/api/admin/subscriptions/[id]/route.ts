import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    if (!hasAdminPermission(adminUser, 'manage_subscriptions') && !hasAdminPermission(adminUser, 'view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    try {
      // Get user subscription details
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          tokensUsed: true,
          createdAt: true,
          updatedAt: true,
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              description: true,
              createdAt: true,
              stripePaymentId: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Get recent payments
          }
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Get additional Stripe data if available
      let stripeSubscription = null
      let stripeCustomer = null

      if (user.stripeCustomerId) {
        try {
          stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId)
        } catch (stripeError) {
          console.error('Error fetching Stripe customer:', stripeError)
        }
      }

      if (user.stripeSubscriptionId) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
        } catch (stripeError) {
          console.error('Error fetching Stripe subscription:', stripeError)
        }
      }

      // Format response
      const tokenLimits = {
        FREE: 10000,
        HOBBY: 50000,
        PROFESSIONAL: 100000,
        BUSINESS: 200000,
        ENTERPRISE: 1000000
      }

      const monthlyPrices = {
        FREE: 0,
        HOBBY: 3.80,
        PROFESSIONAL: 19.80,
        BUSINESS: 16.80,
        ENTERPRISE: 199.00
      }

      const subscriptionDetails = {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name || 'Unknown',
        tier: user.subscriptionTier,
        status: user.subscriptionStatus || 'active',
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        tokenUsage: user.tokensUsed || 0,
        tokenLimit: tokenLimits[user.subscriptionTier as keyof typeof tokenLimits] || 10000,
        monthlyRevenue: monthlyPrices[user.subscriptionTier as keyof typeof monthlyPrices] || 0,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        currentPeriodStart: stripeSubscription?.current_period_start ? 
          new Date(stripeSubscription.current_period_start * 1000).toISOString() : 
          new Date().toISOString(),
        currentPeriodEnd: stripeSubscription?.current_period_end ? 
          new Date(stripeSubscription.current_period_end * 1000).toISOString() : 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payments: user.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount / 100, // Convert from cents
          currency: payment.currency,
          status: payment.status,
          description: payment.description,
          date: payment.createdAt.toISOString(),
          stripePaymentId: payment.stripePaymentId
        })),
        stripeData: {
          customer: stripeCustomer ? {
            id: stripeCustomer.id,
            email: stripeCustomer.email,
            created: new Date((stripeCustomer as any).created * 1000).toISOString(),
            defaultSource: (stripeCustomer as any).default_source
          } : null,
          subscription: stripeSubscription ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
          } : null
        }
      }

      return NextResponse.json({
        success: true,
        subscription: subscriptionDetails
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

  } catch (error) {
    console.error('Subscription details API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin access with subscription management permission
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    if (!hasAdminPermission(adminUser, 'manage_subscriptions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { subscriptionTier, subscriptionStatus, tokensUsed } = body

    try {
      // Update user subscription
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(subscriptionTier && { subscriptionTier }),
          ...(subscriptionStatus && { subscriptionStatus }),
          ...(tokensUsed !== undefined && { tokensUsed }),
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          tokensUsed: true
        }
      })

      // TODO: Sync with Stripe if subscription tier changed
      // This would involve updating the Stripe subscription

      return NextResponse.json({
        success: true,
        subscription: updatedUser,
        message: 'Subscription updated successfully'
      })

    } catch (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

  } catch (error) {
    console.error('Subscription update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}