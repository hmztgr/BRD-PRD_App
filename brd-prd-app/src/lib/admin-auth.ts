import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type AdminPermission = 
  | 'manage_users'
  | 'manage_feedback' 
  | 'manage_content'
  | 'manage_subscriptions'
  | 'view_analytics'
  | 'manage_system'

export interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
  adminPermissions: AdminPermission[]
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('[AdminAuth] No session found')
      return null
    }

    // Simple check: get user's systemRole from database
    const result = await prisma.$queryRaw`
      SELECT id, name, email, "systemRole", "adminPermissions"
      FROM users 
      WHERE id = ${session.user.id}
    `

    const users = result as any[]
    if (!users || users.length === 0) {
      console.log('[AdminAuth] User not found in database')
      return null
    }

    const user = users[0]
    console.log('[AdminAuth] User found:', { email: user.email, systemRole: user.systemRole })
    
    // Simple check: allow SUPER_ADMIN and SUB_ADMIN
    if (user.systemRole !== 'SUPER_ADMIN' && user.systemRole !== 'SUB_ADMIN') {
      console.log('[AdminAuth] User is not admin. SystemRole:', user.systemRole)
      return null
    }

    console.log('[AdminAuth] Admin access granted for:', user.email)
    
    // Return admin user
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.systemRole === 'SUPER_ADMIN' ? 'super_admin' : 'admin',
      adminPermissions: user.adminPermissions || [
        'manage_users',
        'manage_feedback', 
        'manage_content',
        'manage_subscriptions',
        'view_analytics',
        'manage_system'
      ]
    }
  } catch (error) {
    console.error('Error getting admin user:', error)
    return null
  }
}

export async function requireAdmin() {
  const adminUser = await getAdminUser()
  if (!adminUser) {
    throw new Error('Admin access required')
  }
  return adminUser
}

export function hasAdminPermission(
  user: AdminUser | null, 
  permission: AdminPermission
): boolean {
  if (!user) return false
  if (user.role === 'super_admin') return true
  return user.adminPermissions.includes(permission)
}

export async function logAdminActivity(
  adminId: string,
  action: string,
  targetId?: string,
  details?: any
) {
  try {
    // Use raw query to avoid schema issues
    await prisma.$executeRaw`
      INSERT INTO admin_activities ("adminId", action, "targetId", details, "createdAt")
      VALUES (${adminId}, ${action}, ${targetId || null}, ${details ? JSON.stringify(details) : null}, NOW())
    `
  } catch (error) {
    console.error('Error logging admin activity:', error)
  }
}

export function createAdminMiddleware(requiredPermission?: AdminPermission) {
  return async function adminMiddleware(request: NextRequest) {
    try {
      const adminUser = await getAdminUser()
      
      if (!adminUser) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 401 }
        )
      }

      if (requiredPermission && !hasAdminPermission(adminUser, requiredPermission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return NextResponse.next()
    } catch (error) {
      console.error('Admin middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

export async function withAdminSecurity<T>(
  handler: (adminUser: AdminUser, req: NextRequest) => Promise<T>,
  requiredPermission?: AdminPermission
) {
  return async function secureHandler(req: NextRequest): Promise<NextResponse> {
    try {
      const adminUser = await requireAdmin()
      
      if (requiredPermission && !hasAdminPermission(adminUser, requiredPermission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      const result = await handler(adminUser, req)
      return NextResponse.json(result)
      
    } catch (error: any) {
      console.error('Admin API error:', error)
      
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  }
}