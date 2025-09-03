import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get real metrics from database - reduce concurrent connections
    // Critical metrics first (parallel)
    const [totalUsers, recentUsers] = await Promise.all([
      // Total users count
      prisma.user.count(),
      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])

    // Non-critical metrics (sequential to reduce connection pressure)
    let totalDocuments: any[] = [{ count: BigInt(0) }]
    try {
      totalDocuments = await prisma.$queryRaw`SELECT COALESCE((SELECT COUNT(*) FROM documents), 0) as count`
    } catch {
      totalDocuments = [{ count: BigInt(0) }]
    }

    // Recent activities (least critical, done last)
    const recentActivities = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Calculate subscription metrics (mock for now, replace with real Stripe data)
    const activeSubscriptions = Math.floor(totalUsers * 0.25) // Assume 25% conversion
    const totalRevenue = activeSubscriptions * 29.99 // Assume $29.99 per subscription
    const revenueGrowth = 12.5 // Mock growth percentage

    // Transform recent activities
    const formattedActivities = recentActivities.slice(0, 5).map((user, index) => ({
      id: `activity_${index}`,
      action: 'New user registered',
      user: user.email || user.name || 'Unknown user',
      timestamp: getRelativeTime(user.createdAt),
      type: 'user' as const
    }))

    const metrics = {
      totalUsers,
      activeSubscriptions,
      totalRevenue: Math.round(totalRevenue),
      documentsGenerated: Number(totalDocuments[0]?.count || 0),
      newUsersToday: recentUsers,
      revenueGrowth,
      systemHealth: 'healthy' as const,
      recentActivities: formattedActivities
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  } else {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
}