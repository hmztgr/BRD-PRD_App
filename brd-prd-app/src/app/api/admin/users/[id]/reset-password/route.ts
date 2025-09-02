import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'

export async function POST(
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
    const { sendEmail = true } = body

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

    // Generate temporary password
    const tempPassword = randomBytes(12).toString('base64').slice(0, 12) + 'Aa1!'
    const hashedPassword = await hash(tempPassword, 10)

    // Update user password and create reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetTokenExpiry,
        updatedAt: new Date()
      }
    })

    // Log admin activity
    await logAdminActivity(
      adminUser.id,
      'Reset user password',
      user.id,
      { 
        email: user.email,
        sendEmail 
      }
    )

    // If email sending is requested (and email service is configured)
    if (sendEmail && process.env.SENDGRID_API_KEY) {
      // TODO: Send email with password reset link
      // This would integrate with your email service
      // For now, we'll just return the reset token
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      // Only return temp password in development
      ...(process.env.NODE_ENV === 'development' && {
        tempPassword,
        resetToken,
        resetLink: `${process.env.APP_URL}/auth/reset-password/${resetToken}`
      })
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}