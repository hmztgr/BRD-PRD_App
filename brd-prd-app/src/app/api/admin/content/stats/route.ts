import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'manage_content')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // TODO: Calculate real stats from templates table when it exists
    // For now, return mock stats
    const stats = {
      totalTemplates: 12,
      activeTemplates: 10,
      totalUsage: 1847,
      popularTemplate: 'Basic PRD Template',
      categoriesBreakdown: {
        'PRD': 4,
        'BRD': 3,
        'Technical Specs': 2,
        'User Stories': 2,
        'Test Plans': 1
      },
      recentUsage: 145 // Last 7 days
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching content stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}