import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    console.log('Creating emergency admin user...')
    
    // Hash password
    const hashedPassword = await hash('admin123', 10)
    
    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartdocs.ai' },
      update: {
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
        adminPermissions: JSON.stringify([
          'manage_users',
          'manage_feedback', 
          'manage_content',
          'manage_subscriptions',
          'view_analytics',
          'manage_settings'
        ])
      },
      create: {
        email: 'admin@smartdocs.ai',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        subscriptionTier: 'BASIC',
        tokensUsed: 0,
        tokensLimit: 50000,
        emailVerified: new Date(),
        adminPermissions: JSON.stringify([
          'manage_users',
          'manage_feedback', 
          'manage_content',
          'manage_subscriptions',
          'view_analytics',
          'manage_settings'
        ])
      }
    })
    
    console.log('✅ Admin user created/updated successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created/updated successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.adminPermissions
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}