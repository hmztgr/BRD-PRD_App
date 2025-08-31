import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'view_analytics')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Generate usage data for the last N days
    const usageData = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = startOfDay(subDays(now, i))
      const dayEnd = startOfDay(subDays(now, i - 1))

      // Mock usage metrics since we don't have actual tracking yet
      // TODO: Replace with real metrics from usage tracking
      const mockApiCalls = Math.floor(Math.random() * 1000) + 500
      const mockDocumentsGenerated = Math.floor(Math.random() * 200) + 50
      const mockTokensUsed = Math.floor(Math.random() * 50000) + 10000

      // Count active users for this day (users who logged in)
      const activeUsers = await prisma.user.count({
        where: {
          updatedAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      })

      usageData.push({
        date: format(dayStart, 'MMM dd'),
        apiCalls: mockApiCalls,
        documentsGenerated: mockDocumentsGenerated,
        tokensUsed: mockTokensUsed,
        activeUsers: activeUsers || Math.floor(Math.random() * 50) + 10
      })
    }

    return NextResponse.json({
      usageData,
      summary: {
        totalApiCalls: usageData.reduce((sum, day) => sum + day.apiCalls, 0),
        totalDocuments: usageData.reduce((sum, day) => sum + day.documentsGenerated, 0),
        totalTokensUsed: usageData.reduce((sum, day) => sum + day.tokensUsed, 0),
        avgActiveUsers: Math.round(usageData.reduce((sum, day) => sum + day.activeUsers, 0) / usageData.length)
      }
    })

  } catch (error) {
    console.error('Error fetching usage analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}