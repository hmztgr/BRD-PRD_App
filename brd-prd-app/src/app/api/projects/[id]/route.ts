import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            tokensUsed: true,
            createdAt: true,
            updatedAt: true
          }
        },
        files: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            size: true,
            createdAt: true
          }
        },
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 1, // Most recent conversation
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 20, // Last 20 messages
              select: {
                id: true,
                role: true,
                content: true,
                tokenCount: true,
                createdAt: true
              }
            }
          }
        },
        researchRequests: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            query: true,
            status: true,
            confidence: true,
            createdAt: true,
            updatedAt: true
          }
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            summary: true,
            messageRange: true,
            originalTokens: true,
            summaryTokens: true,
            createdAt: true
          }
        },
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 5, // Recent sessions
          select: {
            id: true,
            stage: true,
            confidence: true,
            tokensUsed: true,
            startedAt: true,
            endedAt: true,
            sessionData: true
          }
        },
        _count: {
          select: {
            documents: true,
            files: true,
            conversations: true,
            researchRequests: true,
            summaries: true,
            sessions: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate some derived stats
    const totalDocumentTokens = project.documents.reduce((sum, doc) => sum + doc.tokensUsed, 0)
    const activeResearchCount = project.researchRequests.filter(r => 
      r.status === 'pending' || r.status === 'in_progress'
    ).length

    return NextResponse.json({
      project: {
        ...project,
        stats: {
          totalDocumentTokens,
          activeResearchCount,
          completedResearchCount: project.researchRequests.length - activeResearchCount,
          averageConfidence: project.researchRequests.length > 0 
            ? project.researchRequests.reduce((sum, r) => sum + (r.confidence || 0), 0) / project.researchRequests.length 
            : 0
        }
      }
    })

  } catch (error) {
    console.error('Project fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      name, 
      description, 
      industry, 
      country, 
      status, 
      stage, 
      confidence, 
      metadata 
    } = body

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Validate input
    if (name && name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name cannot be empty' },
        { status: 400 }
      )
    }

    if (status && !['active', 'paused', 'completed', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    if (stage && !['initial', 'research', 'analysis', 'generation'].includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage value' },
        { status: 400 }
      )
    }

    if (confidence !== undefined && (confidence < 0 || confidence > 100)) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Update project
    const updateData: any = {
      updatedAt: new Date(),
      lastActivity: new Date()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (industry !== undefined) updateData.industry = industry || null
    if (country !== undefined) updateData.country = country || null
    if (status !== undefined) updateData.status = status
    if (stage !== undefined) updateData.stage = stage
    if (confidence !== undefined) updateData.confidence = confidence
    if (metadata !== undefined) {
      // Merge with existing metadata
      updateData.metadata = {
        ...existingProject.metadata as any,
        ...metadata
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
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

    return NextResponse.json({
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        industry: updatedProject.industry,
        country: updatedProject.country,
        status: updatedProject.status,
        stage: updatedProject.stage,
        confidence: updatedProject.confidence,
        totalTokens: updatedProject.totalTokens,
        lastActivity: updatedProject.lastActivity,
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
        metadata: updatedProject.metadata,
        counts: updatedProject._count
      }
    })

  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const permanent = searchParams.get('permanent') === 'true'

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (permanent) {
      // Permanently delete the project and all related data
      await prisma.project.delete({
        where: { id: params.id }
      })

      return NextResponse.json({ 
        message: 'Project permanently deleted',
        permanent: true
      })
    } else {
      // Soft delete - archive the project
      await prisma.project.update({
        where: { id: params.id },
        data: { 
          status: 'archived',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'Project archived',
        permanent: false
      })
    }

  } catch (error) {
    console.error('Project delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}