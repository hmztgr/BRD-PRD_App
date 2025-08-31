import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const subscriptionTier = searchParams.get('subscriptionTier')

    // Build where clause for filtering
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role && role !== 'all') {
      whereClause.role = role
    }
    
    if (subscriptionTier && subscriptionTier !== 'all') {
      whereClause.subscriptionTier = subscriptionTier
    }

    // Fetch users with filtering
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        emailVerified: true,
        tokensUsed: true,
        tokensLimit: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Generate CSV content
    const csvRows = [
      'ID,Name,Email,Role,Subscription Tier,Subscription Status,Email Verified,Tokens Used,Tokens Limit,Created At,Last Updated'
    ]

    for (const user of users) {
      csvRows.push([
        user.id,
        `"${user.name || ''}"`,
        user.email,
        user.role || 'user',
        user.subscriptionTier || 'FREE',
        user.subscriptionStatus || 'active',
        user.emailVerified ? 'Yes' : 'No',
        user.tokensUsed || 0,
        user.tokensLimit || 10000,
        format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    }

    const csvContent = csvRows.join('\n')
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
    const filename = `users-export-${timestamp}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}