import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('[AdminTest] Starting admin check...')
    
    // 1. Check session
    const session = await getServerSession(authOptions)
    console.log('[AdminTest] Session:', session ? 'EXISTS' : 'NOT_FOUND')
    if (session) {
      console.log('[AdminTest] Session user:', {
        id: session.user?.id,
        email: session.user?.email,
        role: session.user?.role
      })
    }

    if (!session?.user?.id) {
      return NextResponse.json({
        status: 'NO_SESSION',
        message: 'No session found'
      })
    }

    // 2. Check database user
    console.log('[AdminTest] Checking database user...')
    const result = await prisma.$queryRaw`
      SELECT id, name, email, "systemRole", "adminPermissions"
      FROM users 
      WHERE id = ${session.user.id}
    `

    const users = result as any[]
    console.log('[AdminTest] Database query result:', users)

    if (!users || users.length === 0) {
      return NextResponse.json({
        status: 'USER_NOT_FOUND',
        message: 'User not found in database',
        sessionUserId: session.user.id
      })
    }

    const user = users[0]
    console.log('[AdminTest] User from DB:', {
      email: user.email,
      systemRole: user.systemRole,
      adminPermissions: user.adminPermissions
    })

    // 3. Check admin status
    const isAdmin = user.systemRole === 'SUPER_ADMIN' || user.systemRole === 'SUB_ADMIN'
    console.log('[AdminTest] Is admin:', isAdmin)

    return NextResponse.json({
      status: 'SUCCESS',
      session: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      database: {
        email: user.email,
        systemRole: user.systemRole,
        adminPermissions: user.adminPermissions,
        isAdmin
      }
    })

  } catch (error) {
    console.error('[AdminTest] Error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}