import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '4'), 10) // Max 10, default 4

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
        status: { not: 'archived' } // Exclude archived projects
      },
      take: limit,
      orderBy: { lastActivity: 'desc' },
      include: {
        documents: {
          select: { id: true, type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3 // Show 3 most recent documents
        },
        files: {
          select: { id: true, type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3 // Show 3 most recent files
        },
        researchRequests: {
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 2 // Show 2 most recent research items
        },
        _count: {
          select: {
            documents: true,
            files: true,
            conversations: true,
            researchRequests: true
          }
        }
      }
    })

    // Format projects for dashboard display
    const formattedProjects = projects.map(project => {
      const activeResearch = project.researchRequests.filter(r => 
        r.status === 'pending' || r.status === 'in_progress'
      ).length

      // Calculate time since last activity
      const timeSinceActivity = Date.now() - project.lastActivity.getTime()
      const hoursAgo = Math.floor(timeSinceActivity / (1000 * 60 * 60))
      const daysAgo = Math.floor(hoursAgo / 24)
      
      let lastActivityText = ''
      if (daysAgo > 0) {
        lastActivityText = daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
      } else if (hoursAgo > 0) {
        lastActivityText = hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`
      } else {
        const minutesAgo = Math.floor(timeSinceActivity / (1000 * 60))
        if (minutesAgo > 0) {
          lastActivityText = minutesAgo === 1 ? '1 minute ago' : `${minutesAgo} minutes ago`
        } else {
          lastActivityText = 'Just now'
        }
      }

      // Create activity summary
      const activitySummary = []
      if (project._count.documents > 0) {
        activitySummary.push(`${project._count.documents} document${project._count.documents !== 1 ? 's' : ''}`)
      }
      if (project._count.files > 0) {
        activitySummary.push(`${project._count.files} file${project._count.files !== 1 ? 's' : ''}`)
      }
      if (activeResearch > 0) {
        activitySummary.push(`${activeResearch} active research`)
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        industry: project.industry,
        status: project.status,
        stage: project.stage,
        confidence: project.confidence,
        totalTokens: project.totalTokens,
        lastActivity: project.lastActivity,
        lastActivityText,
        activitySummary: activitySummary.length > 0 ? activitySummary.join(' • ') : 'No activity yet',
        counts: project._count,
        recentDocuments: project.documents,
        recentFiles: project.files,
        hasActiveResearch: activeResearch > 0,
        progressColor: project.confidence >= 80 ? 'green' : 
                      project.confidence >= 60 ? 'blue' :
                      project.confidence >= 40 ? 'yellow' : 'gray'
      }
    })

    return NextResponse.json({
      projects: formattedProjects,
      total: formattedProjects.length
    })

  } catch (error) {
    console.error('Recent projects fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent projects' },
      { status: 500 }
    )
  }
}