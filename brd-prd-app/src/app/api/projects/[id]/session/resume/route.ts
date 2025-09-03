import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify project ownership and get full project data
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
                metadata: true
              }
            }
          }
        },
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            stage: true,
            confidence: true,
            tokensUsed: true,
            sessionData: true,
            startedAt: true,
            endedAt: true
          }
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
          take: 3, // Get last 3 summaries for context
          select: {
            id: true,
            summary: true,
            messageRange: true,
            summaryTokens: true,
            createdAt: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get the most recent conversation and session
    const latestConversation = project.conversations[0]
    const latestSession = project.sessions[0]

    // Prepare the session state
    const sessionState = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        industry: project.industry,
        country: project.country,
        status: project.status,
        stage: project.stage,
        confidence: project.confidence,
        totalTokens: project.totalTokens,
        metadata: project.metadata,
        lastActivity: project.lastActivity
      },
      conversation: latestConversation ? {
        id: latestConversation.id,
        messages: latestConversation.messages,
        totalMessages: latestConversation.messages.length,
        activeTokens: latestConversation.activeTokens
      } : null,
      session: latestSession ? {
        id: latestSession.id,
        stage: latestSession.stage,
        confidence: latestSession.confidence,
        tokensUsed: latestSession.tokensUsed,
        sessionData: latestSession.sessionData,
        isActive: !latestSession.endedAt
      } : null,
      summaries: project.summaries.map(summary => ({
        id: summary.id,
        summary: summary.summary,
        messageRange: summary.messageRange,
        tokens: summary.summaryTokens,
        createdAt: summary.createdAt
      })),
      contextInfo: {
        totalSummaries: project.summaries.length,
        hasActiveSession: latestSession && !latestSession.endedAt,
        canContinue: latestConversation && latestConversation.messages.length > 0,
        lastActivity: project.lastActivity
      }
    }

    // Update project last activity
    await prisma.project.update({
      where: { id: id },
      data: { 
        lastActivity: new Date(),
        updatedAt: new Date()
      }
    })

    // Mark session as resumed if it exists
    if (latestSession && !latestSession.endedAt) {
      await prisma.projectSession.update({
        where: { id: latestSession.id },
        data: {
          endedAt: null, // Ensure it's active
          sessionData: {
            ...(latestSession.sessionData as any || {}),
            resumedAt: new Date().toISOString()
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      resumedAt: new Date().toISOString(),
      sessionState
    })

  } catch (error) {
    console.error('Session resume error:', error)
    return NextResponse.json(
      { error: 'Failed to resume session' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get project session history
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 10, // Last 10 sessions
          select: {
            id: true,
            stage: true,
            confidence: true,
            tokensUsed: true,
            startedAt: true,
            endedAt: true,
            sessionData: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sessionHistory = project.sessions.map(sess => {
      const duration = sess.endedAt 
        ? sess.endedAt.getTime() - sess.startedAt.getTime()
        : Date.now() - sess.startedAt.getTime()

      return {
        id: sess.id,
        stage: sess.stage,
        confidence: sess.confidence,
        tokensUsed: sess.tokensUsed,
        startedAt: sess.startedAt,
        endedAt: sess.endedAt,
        isActive: !sess.endedAt,
        duration: Math.floor(duration / (1000 * 60)), // Duration in minutes
        messageCount: (sess.sessionData as any)?.messageCount || 0
      }
    })

    return NextResponse.json({
      projectId: id,
      projectName: project.name,
      projectStage: project.stage,
      sessions: sessionHistory,
      totalSessions: sessionHistory.length,
      hasActiveSessions: sessionHistory.some(s => s.isActive)
    })

  } catch (error) {
    console.error('Session history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session history' },
      { status: 500 }
    )
  }
}