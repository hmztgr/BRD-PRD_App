import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !session.user.adminPermissions?.includes('manage_feedback')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { status, adminResponse } = await request.json()
    const { id } = await params

    // Validate status
    const validStatuses = ['pending', 'in_review', 'approved', 'rejected', 'implemented']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Update feedback status
    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: {
        status,
        ...(adminResponse && { adminResponse }),
        ...(status === 'approved' && {
          approvedAt: new Date(),
          approvedBy: session.user.id
        })
      }
    })

    return NextResponse.json({
      success: true,
      feedback: updatedFeedback
    })

  } catch (error) {
    console.error('Error updating feedback status:', error)
    
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update feedback status' },
      { status: 500 }
    )
  }
}