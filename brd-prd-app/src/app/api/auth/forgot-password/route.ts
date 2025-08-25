import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    // but only send email if user exists
    if (user) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 3600000) // 1 hour from now

      // Store token in database
      await prisma.emailToken.create({
        data: {
          token,
          type: 'password_reset',
          userId: user.id,
          email: user.email,
          expires,
          used: false,
        }
      })

      // Send password reset email
      await sendPasswordResetEmail(user.email, user.name || 'User', token)
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}