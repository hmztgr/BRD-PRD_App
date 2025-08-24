import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Development-only endpoint to create test users
export async function POST(req: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { email = 'test-pro@example.com', name = 'Test Professional User' } = await req.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Update existing user to professional tier
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          subscriptionTier: 'professional',
          subscriptionStatus: 'active',
          tokensLimit: 50000, // 50K tokens for professional
          tokensUsed: 0
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Existing user upgraded to professional tier',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          subscriptionTier: updatedUser.subscriptionTier
        }
      })
    }

    // Create new professional user
    const hashedPassword = await bcrypt.hash('testpassword123', 12)
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: new Date(), // Mark as verified for testing
        subscriptionTier: 'professional',
        subscriptionStatus: 'active',
        tokensLimit: 50000, // 50K tokens for professional
        tokensUsed: 0,
        language: 'en',
        companyName: 'Test Company',
        industry: 'Technology'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Professional test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier
      },
      credentials: {
        email,
        password: 'testpassword123'
      },
      instructions: 'You can now sign in with these credentials to test professional features.'
    })

  } catch (error) {
    console.error('Error creating professional test user:', error)
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    )
  }
}