import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths, format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '12')

    // Fetch all analytics data
    const now = new Date()
    const csvRows = ['Date,New Users,Total Users,Verified Users,Subscribed Users,Revenue,Active Subscriptions']

    for (let i = timeRange - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = startOfMonth(subMonths(now, i - 1))
      const monthStr = format(monthStart, 'yyyy-MM')

      const [totalUsers, newUsers, verifiedUsers, subscribedUsers] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { lt: monthEnd } }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
            emailVerified: { not: null }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: monthStart, lt: monthEnd },
            subscriptionTier: { not: 'FREE' }
          }
        })
      ])

      // Calculate estimated revenue (mock calculation)
      const estimatedRevenue = subscribedUsers * 29.99

      csvRows.push(
        `${monthStr},${newUsers},${totalUsers},${verifiedUsers},${subscribedUsers},${estimatedRevenue.toFixed(2)},${subscribedUsers}`
      )
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${timeRange}m-${format(now, 'yyyy-MM-dd')}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}