import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // USE EXISTING AUTH FUNCTIONS - DO NOT CHANGE
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await req.json()
    const { action } = body

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-modification
    if (user.id === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      )
    }

    let updatedUser
    let actionDescription = ''

    switch (action) {
      case 'suspend':
        updatedUser = await prisma.user.update({
          where: { id },
          data: { 
            subscriptionStatus: 'suspended',
            updatedAt: new Date()
          }
        })
        actionDescription = 'Suspended user account'
        break

      case 'activate':
        updatedUser = await prisma.user.update({
          where: { id },
          data: { 
            subscriptionStatus: 'active',
            updatedAt: new Date()
          }
        })
        actionDescription = 'Activated user account'
        break

      case 'verify_email':
        updatedUser = await prisma.user.update({
          where: { id },
          data: { 
            emailVerified: new Date(),
            updatedAt: new Date()
          }
        })
        actionDescription = 'Verified user email'
        break

      case 'reset_tokens':
        updatedUser = await prisma.user.update({
          where: { id },
          data: { 
            tokensUsed: 0,
            updatedAt: new Date()
          }
        })
        actionDescription = 'Reset token usage'
        break

      case 'change_role':
        const { role } = body
        if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          )
        }
        updatedUser = await prisma.user.update({
          where: { id },
          data: { 
            role,
            updatedAt: new Date()
          }
        })
        actionDescription = `Changed role to ${role}`
        break

      case 'adjust_tokens':
        const { tokensLimit } = body
        if (typeof tokensLimit !== 'number' || tokensLimit < 0) {
          return NextResponse.json(
            { error: 'Invalid token limit' },
            { status: 400 }
          )
        }
        updatedUser = await prisma.user.update({
          where: { id },
          data: { 
            tokensLimit,
            updatedAt: new Date()
          }
        })
        actionDescription = `Adjusted token limit to ${tokensLimit}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Log admin activity
    await logAdminActivity(
      adminUser.id,
      actionDescription,
      user.id,
      { action, ...body }
    )

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `${actionDescription} successfully`
    })

  } catch (error) {
    console.error('User action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}