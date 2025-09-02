import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

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

    // Prevent self-deletion
    if (user.id === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Prevent deletion of other admins unless super admin
    if ((user.role === 'admin' || user.role === 'super_admin') && adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can delete other admin accounts' },
        { status: 403 }
      )
    }

    // Delete user and all related data (cascade delete)
    await prisma.user.delete({
      where: { id }
    })

    // Log admin activity
    await logAdminActivity(
      adminUser.id,
      'Deleted user account',
      user.id,
      { 
        deletedUser: {
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const body = await req.json()
    const { name, email, role, subscriptionTier, tokensLimit } = body

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

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) {
      // Only super admin can assign super admin role
      if (role === 'super_admin' && adminUser.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only super admins can assign super admin role' },
          { status: 403 }
        )
      }
      updateData.role = role
    }
    if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier
    if (tokensLimit !== undefined) updateData.tokensLimit = tokensLimit

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })

    // Log admin activity
    await logAdminActivity(
      adminUser.id,
      'Updated user details',
      user.id,
      { changes: body }
    )

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}