import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get subscription distribution
    const subscriptionCounts = await prisma.$queryRaw`
      SELECT 
        COALESCE("subscriptionTier", 'free') as tier,
        COUNT(*) as users,
        SUM(CASE 
          WHEN "subscriptionTier" = 'HOBBY' THEN 9.99
          WHEN "subscriptionTier" = 'PROFESSIONAL' THEN 29.99
          WHEN "subscriptionTier" = 'BUSINESS' THEN 99.99
          WHEN "subscriptionTier" = 'ENTERPRISE' THEN 299.99
          ELSE 0
        END) as revenue
      FROM users
      WHERE "subscriptionStatus" = 'active' OR "subscriptionStatus" IS NULL
      GROUP BY "subscriptionTier"
      ORDER BY users DESC
    ` as Array<{ tier: string; users: bigint; revenue: number }>

    const totalUsers = subscriptionCounts.reduce((sum, item) => sum + Number(item.users), 0)
    
    const distribution = subscriptionCounts.map(item => ({
      tier: item.tier.toLowerCase(),
      users: Number(item.users),
      revenue: Number(item.revenue),
      percentage: Math.round((Number(item.users) / totalUsers) * 100)
    }))

    return NextResponse.json({
      distribution,
      summary: {
        totalUsers,
        totalRevenue: distribution.reduce((sum, item) => sum + item.revenue, 0),
        paidUsers: distribution.filter(item => item.tier !== 'free').reduce((sum, item) => sum + item.users, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching subscription distribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}