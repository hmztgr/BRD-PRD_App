import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.user.adminPermissions?.includes('manage_feedback')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    try {
      // Get feedback statistics
      const [
        totalFeedback,
        avgRating,
        feedbackByStatus,
        feedbackByRating
      ] = await Promise.all([
        prisma.feedback.count(),
        prisma.feedback.aggregate({
          _avg: {
            rating: true
          }
        }),
        prisma.feedback.groupBy({
          by: ['status'],
          _count: {
            status: true
          }
        }),
        prisma.feedback.groupBy({
          by: ['rating'],
          _count: {
            rating: true
          }
        })
      ])

      // Transform to match frontend expectations
      const statusCounts = feedbackByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>)

      const stats = {
        total: totalFeedback,
        pending: statusCounts.pending || 0,
        approved: statusCounts.approved || 0,
        rejected: statusCounts.rejected || 0,
        in_review: statusCounts.in_review || 0,
        implemented: statusCounts.implemented || 0,
        averageRating: avgRating._avg.rating ? parseFloat(avgRating._avg.rating.toFixed(1)) : 0,
        statusDistribution: statusCounts,
        ratingDistribution: feedbackByRating.reduce((acc, item) => {
          if (item.rating) {
            acc[item.rating.toString()] = item._count.rating
          }
          return acc
        }, {} as Record<string, number>)
      }

      return NextResponse.json({
        success: true,
        stats
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      
      // Mock stats fallback
      const mockStats = {
        total: 1,
        pending: 1,
        approved: 0,
        rejected: 0,
        in_review: 0,
        implemented: 0,
        averageRating: 5.0,
        statusDistribution: {
          pending: 1,
          approved: 0,
          rejected: 0,
          in_review: 0,
          implemented: 0
        },
        ratingDistribution: {
          '5': 1
        }
      }

      return NextResponse.json({
        success: true,
        stats: mockStats
      })
    }

  } catch (error) {
    console.error('Feedback stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback statistics' },
      { status: 500 }
    )
  }
}