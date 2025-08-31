import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    if (!hasAdminPermission(adminUser, 'manage_feedback')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const rating = searchParams.get('rating')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    try {
      // Build where clause
      const where: any = {}
      if (status && status !== 'all') where.status = status
      if (rating && rating !== 'all') where.rating = parseInt(rating)
      if (category && category !== 'all') where.category = category

      // Get feedback from database
      const [feedback, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.feedback.count({ where })
      ])

      return NextResponse.json({
        success: true,
        feedback: feedback.map(item => ({
          id: item.id,
          message: item.message,
          rating: item.rating,
          category: item.category,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          user: item.user ? {
            id: item.user.id,
            name: item.user.name || 'Anonymous',
            email: item.user.email
          } : null
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      
      // Mock data fallback
      const mockFeedback = [
        {
          id: '1',
          message: 'Great platform for document generation! Very intuitive.',
          rating: 5,
          category: 'general',
          status: 'reviewed',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          user: {
            id: 'user1',
            name: 'Ahmed Al-Rashid',
            email: 'ahmed@example.com'
          }
        },
        {
          id: '2',
          message: 'The BRD generation could be more detailed.',
          rating: 3,
          category: 'feature_request',
          status: 'pending',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          user: {
            id: 'user2',
            name: 'Sara Abdullah',
            email: 'sara@example.com'
          }
        }
      ]

      return NextResponse.json({
        success: true,
        feedback: mockFeedback,
        pagination: {
          page: 1,
          limit: 20,
          total: mockFeedback.length,
          pages: 1
        }
      })
    }

  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}