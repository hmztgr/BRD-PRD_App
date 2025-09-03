import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access with subscription management permission
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    if (!hasAdminPermission(adminUser, 'manage_subscriptions') && !hasAdminPermission(adminUser, 'view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tier = searchParams.get('tier')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    try {
      // Build where clause for filtering
      const where: any = {}

      // Search by email or name
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Filter by subscription tier
      if (tier && tier !== 'ALL') {
        where.subscriptionTier = tier
      }

      // Filter by subscription status
      if (status && status !== 'ALL') {
        where.subscriptionStatus = status
      }

      // Get users with subscription data
      const users = await prisma.user.findMany({
        where,
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
              amount: true,
              currency: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1 // Get latest payment
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      })

      // Transform user data to subscription format
      const subscriptions = users.map(user => {
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

        const latestPayment = user.payments[0]
        
        return {
          id: user.id,
          userId: user.id,
          email: user.email,
          name: user.name || 'Unknown',
          tier: user.subscriptionTier,
          status: user.subscriptionStatus || 'active',
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          currentPeriodStart: new Date().toISOString(), // Mock - would come from Stripe
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Mock
          tokenUsage: user.tokensUsed || 0,
          tokenLimit: tokenLimits[user.subscriptionTier as keyof typeof tokenLimits] || 10000,
          monthlyRevenue: monthlyPrices[user.subscriptionTier as keyof typeof monthlyPrices] || 0,
          createdAt: user.createdAt.toISOString(),
          lastPayment: latestPayment ? {
            amount: latestPayment.amount / 100, // Convert from cents
            status: latestPayment.status,
            date: latestPayment.createdAt.toISOString()
          } : null
        }
      })

      // Get total count for pagination
      const total = await prisma.user.count({ where })

      return NextResponse.json({
        success: true,
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Subscriptions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}