import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, testType = 'full' } = await request.json()
    
    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      steps: {}
    }

    // Step 1: Test database connectivity
    try {
      const dbTest = await prisma.$queryRaw`SELECT 1 as test`
      results.steps.databaseConnection = {
        status: 'success',
        result: dbTest
      }
    } catch (error: any) {
      results.steps.databaseConnection = {
        status: 'error',
        error: error.message
      }
      return NextResponse.json(results)
    }

    if (testType === 'connection-only') {
      return NextResponse.json(results)
    }

    // Step 2: Find user in database
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          adminPermissions: true,
          emailVerified: true,
          createdAt: true
        }
      })

      results.steps.userLookup = {
        status: user ? 'found' : 'not_found',
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          adminPermissions: user.adminPermissions,
          emailVerified: !!user.emailVerified,
          hasPassword: !!user.password,
          passwordHash: user.password ? user.password.substring(0, 20) + '...' : null,
          createdAt: user.createdAt
        } : null
      }

      if (!user) {
        return NextResponse.json(results)
      }

      // Step 3: Test password comparison
      if (password && user.password) {
        try {
          const isPasswordValid = await bcrypt.compare(password, user.password)
          results.steps.passwordComparison = {
            status: 'tested',
            isValid: isPasswordValid,
            providedPassword: password,
            hashInDb: user.password.substring(0, 20) + '...'
          }
        } catch (error: any) {
          results.steps.passwordComparison = {
            status: 'error',
            error: error.message
          }
        }
      }

      // Step 4: Test admin permissions check
      const adminEmails = ['admin@smartdocs.ai', 'hamza@smartdocs.ai']
      const hasAdminPerms = user.adminPermissions && Array.isArray(user.adminPermissions) && user.adminPermissions.length > 0
      const isEmailAdmin = adminEmails.includes(user.email || '')
      
      results.steps.adminCheck = {
        status: 'tested',
        hasAdminPermissions: hasAdminPerms,
        isEmailAdmin: isEmailAdmin,
        isAdmin: hasAdminPerms || isEmailAdmin,
        role: user.role
      }

    } catch (error: any) {
      results.steps.userLookup = {
        status: 'error',
        error: error.message
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug API error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Test database connection only
export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const dbTest = await prisma.$queryRaw`SELECT NOW() as current_time, current_database() as database_name`
    
    // Test users table
    const userCount = await prisma.user.count()
    
    // Get admin user info
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' },
      select: {
        id: true,
        email: true,
        role: true,
        adminPermissions: true,
        emailVerified: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      database: dbTest,
      userCount,
      adminUser,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing'
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}