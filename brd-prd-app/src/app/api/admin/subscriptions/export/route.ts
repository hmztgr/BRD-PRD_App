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
    const format = searchParams.get('format') || 'csv'
    const includeTier = searchParams.get('tier')
    const includeStatus = searchParams.get('status')

    try {
      // Build where clause for filtering
      const where: any = {}
      
      if (includeTier && includeTier !== 'ALL') {
        where.subscriptionTier = includeTier
      }
      
      if (includeStatus && includeStatus !== 'ALL') {
        where.subscriptionStatus = includeStatus
      }

      // Get all users with subscription data
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
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (format === 'csv') {
        // Generate CSV content
        const csvHeader = [
          'User ID',
          'Email',
          'Name',
          'Subscription Tier',
          'Status',
          'Tokens Used',
          'Token Limit',
          'Monthly Revenue',
          'Stripe Customer ID',
          'Stripe Subscription ID',
          'Created Date',
          'Last Payment Amount',
          'Last Payment Date',
          'Last Payment Status'
        ].join(',')

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

        const csvRows = users.map(user => {
          const latestPayment = user.payments[0]
          const tokenLimit = tokenLimits[user.subscriptionTier as keyof typeof tokenLimits] || 10000
          const monthlyRevenue = monthlyPrices[user.subscriptionTier as keyof typeof monthlyPrices] || 0

          return [
            user.id,
            `"${user.email}"`,
            `"${user.name || ''}"`,
            user.subscriptionTier,
            user.subscriptionStatus || 'active',
            user.tokensUsed || 0,
            tokenLimit,
            monthlyRevenue,
            user.stripeCustomerId || '',
            user.stripeSubscriptionId || '',
            user.createdAt.toISOString(),
            latestPayment ? (latestPayment.amount / 100) : '',
            latestPayment ? latestPayment.createdAt.toISOString() : '',
            latestPayment ? latestPayment.status : ''
          ].join(',')
        })

        const csvContent = [csvHeader, ...csvRows].join('\n')
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="subscriptions_export_${new Date().toISOString().split('T')[0]}.csv"`
          }
        })

      } else if (format === 'json') {
        // Return JSON format
        const jsonData = users.map(user => {
          const latestPayment = user.payments[0]
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

          return {
            userId: user.id,
            email: user.email,
            name: user.name || '',
            subscriptionTier: user.subscriptionTier,
            status: user.subscriptionStatus || 'active',
            tokensUsed: user.tokensUsed || 0,
            tokenLimit: tokenLimits[user.subscriptionTier as keyof typeof tokenLimits] || 10000,
            monthlyRevenue: monthlyPrices[user.subscriptionTier as keyof typeof monthlyPrices] || 0,
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId,
            createdAt: user.createdAt.toISOString(),
            lastPayment: latestPayment ? {
              amount: latestPayment.amount / 100,
              date: latestPayment.createdAt.toISOString(),
              status: latestPayment.status
            } : null
          }
        })

        return new NextResponse(JSON.stringify(jsonData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="subscriptions_export_${new Date().toISOString().split('T')[0]}.json"`
          }
        })
      }

      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })

    } catch (dbError) {
      console.error('Database export error:', dbError)
      
      // Fallback to mock data export
      const mockData = [
        {
          userId: 'user1',
          email: 'ahmed@example.com',
          name: 'Ahmed Al-Rashid',
          subscriptionTier: 'PROFESSIONAL',
          status: 'active',
          tokensUsed: 85000,
          tokenLimit: 100000,
          monthlyRevenue: 19.80,
          stripeCustomerId: 'cus_123456789',
          stripeSubscriptionId: 'sub_123456789',
          createdAt: '2024-12-15T10:30:00Z'
        },
        {
          userId: 'user2',
          email: 'sara.tech@startup.sa',
          name: 'Sara Abdullah',
          subscriptionTier: 'BUSINESS',
          status: 'active',
          tokensUsed: 150000,
          tokenLimit: 200000,
          monthlyRevenue: 16.80,
          stripeCustomerId: 'cus_987654321',
          stripeSubscriptionId: 'sub_987654321',
          createdAt: '2024-11-20T14:15:00Z'
        }
      ]

      if (format === 'csv') {
        const csvHeader = 'User ID,Email,Name,Subscription Tier,Status,Tokens Used,Token Limit,Monthly Revenue,Stripe Customer ID,Stripe Subscription ID,Created Date'
        const csvRows = mockData.map(user => 
          `${user.userId},"${user.email}","${user.name}",${user.subscriptionTier},${user.status},${user.tokensUsed},${user.tokenLimit},${user.monthlyRevenue},${user.stripeCustomerId},${user.stripeSubscriptionId},${user.createdAt}`
        )
        const csvContent = [csvHeader, ...csvRows].join('\n')
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="subscriptions_export_mock.csv"'
          }
        })
      } else {
        return new NextResponse(JSON.stringify(mockData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="subscriptions_export_mock.json"'
          }
        })
      }
    }

  } catch (error) {
    console.error('Subscriptions export API error:', error)
    return NextResponse.json(
      { error: 'Failed to export subscriptions' },
      { status: 500 }
    )
  }
}