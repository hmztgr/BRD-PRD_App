import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined
  let session: any
  try {
    session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paramsResult = await params
    id = paramsResult.id
    const body = await req.json()
    const { 
      conversationId, 
      stage, 
      confidence, 
      sessionData,
      messages = [],
      currentTab = 'chat',
      uiState = {}
    } = body

    // Log the save request for debugging
    console.log('Session save request:', {
      projectId: id,
      userId: session.user.id,
      messageCount: messages.length,
      conversationId,
      currentTab,
      timestamp: new Date().toISOString()
    })

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate tokens used in this session
    const sessionTokens = messages.reduce((total: number, msg: any) => {
      const contentLength = msg.content?.length || 0
      return total + Math.ceil(contentLength / 4) // Using existing estimation method
    }, 0)

    // Start a transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update project metadata and activity
      const updatedProject = await tx.project.update({
        where: { id: id },
        data: {
          stage: stage || project.stage,
          confidence: confidence !== undefined ? confidence : project.confidence,
          lastActivity: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...(project.metadata as any || {}),
            currentTab,
            uiState,
            lastSaved: new Date().toISOString()
          }
        }
      })

      // Create or update conversation if provided
      let conversation = null
      if (conversationId) {
        conversation = await tx.conversation.upsert({
          where: { id: conversationId },
          update: {
            projectId: id,
            updatedAt: new Date(),
            metadata: {
              activeTokens: sessionTokens,
              messageCount: messages.length
            }
          },
          create: {
            id: conversationId,
            userId: session.user.id,
            projectId: id,
            status: 'active',
            metadata: {
              activeTokens: sessionTokens,
              messageCount: messages.length
            }
          }
        })

        // Save messages if provided
        if (messages.length > 0) {
          // Delete existing messages and replace with current ones
          await tx.message.deleteMany({
            where: { conversationId }
          })

          await tx.message.createMany({
            data: messages.map((msg: any) => ({
              id: msg.id,
              conversationId,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
              metadata: {
                ...msg.metadata,
                tokenCount: msg.tokenCount || Math.ceil((msg.content?.length || 0) / 4)
              }
            }))
          })
        }
      }

      // Create/update project session record
      const projectSession = await tx.projectSession.upsert({
        where: {
          projectId_conversationId: {
            projectId: id,
            conversationId: conversationId || 'default'
          }
        },
        update: {
          stage: stage || project.stage,
          confidence: confidence !== undefined ? confidence : project.confidence,
          tokensUsed: sessionTokens,
          endedAt: null, // Session is active
          sessionData: {
            ...sessionData,
            messageCount: messages.length,
            currentTab,
            uiState
          }
        },
        create: {
          projectId: id,
          conversationId: conversationId || 'default',
          stage: stage || project.stage,
          confidence: confidence !== undefined ? confidence : project.confidence,
          tokensUsed: sessionTokens,
          sessionData: {
            ...sessionData,
            messageCount: messages.length,
            currentTab,
            uiState
          }
        }
      })

      return { updatedProject, conversation, projectSession }
    })

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
      sessionData: {
        projectId: id,
        conversationId,
        stage: result.updatedProject.stage,
        confidence: result.updatedProject.confidence,
        tokensUsed: sessionTokens,
        messageCount: messages.length
      }
    })

  } catch (error) {
    console.error('Session save error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      projectId: id || 'unknown',
      userId: session?.user?.id || 'unknown',
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Failed to save session',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    )
  }
}