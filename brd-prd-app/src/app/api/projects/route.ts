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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50) // Max 50 per page
    const status = searchParams.get('status') || 'all'
    const industry = searchParams.get('industry')
    const sortBy = searchParams.get('sortBy') || 'lastActivity'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { userId: session.user.id }
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (industry) {
      where.industry = industry
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'created') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'updated') {
      orderBy.updatedAt = sortOrder
    } else {
      orderBy.lastActivity = sortOrder
    }

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          documents: {
            select: { id: true, type: true, createdAt: true }
          },
          files: {
            select: { id: true, fileType: true, createdAt: true }
          },
          researchRequests: {
            select: { id: true, status: true, createdAt: true }
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
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        industry: project.industry,
        country: project.country,
        status: project.status,
        stage: project.stage,
        confidence: project.confidence,
        totalTokens: project.totalTokens,
        lastActivity: project.lastActivity,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        counts: project._count,
        recentDocuments: project.documents.slice(0, 3), // Show 3 most recent
        recentFiles: project.files.slice(0, 3),
        hasActiveResearch: project.researchRequests.some(r => r.status === 'pending' || r.status === 'in_progress')
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, industry, country, initialBrief } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Check user's project limit based on subscription tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        subscriptionTier: true,
        _count: { select: { projects: true } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Define project limits by tier
    const PROJECT_LIMITS = {
      FREE: 3,
      HOBBY: 10,
      PROFESSIONAL: 20,
      BUSINESS: 50,
      ENTERPRISE: 999
    }

    const maxProjects = PROJECT_LIMITS[user.subscriptionTier] || PROJECT_LIMITS.FREE
    
    if (user._count.projects >= maxProjects) {
      return NextResponse.json({
        error: `Project limit reached. Your ${user.subscriptionTier} plan allows ${maxProjects} projects.`,
        upgradeRequired: user.subscriptionTier === 'FREE'
      }, { status: 403 })
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        industry: industry || null,
        country: country || null,
        userId: session.user.id,
        metadata: initialBrief ? { initialBrief } : {}
      },
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
        id: project.id,
        name: project.name,
        description: project.description,
        industry: project.industry,
        country: project.country,
        status: project.status,
        stage: project.stage,
        confidence: project.confidence,
        totalTokens: project.totalTokens,
        lastActivity: project.lastActivity,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        counts: project._count
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}