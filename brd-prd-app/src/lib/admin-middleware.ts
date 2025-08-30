import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getFallbackUserSession } from '@/lib/fallback-auth'

/**
 * Admin Permission Types
 */
export type AdminPermission = 
  | 'manage_users' 
  | 'manage_feedback' 
  | 'manage_content' 
  | 'view_analytics' 
  | 'manage_settings'
  | 'super_admin'

/**
 * Admin role hierarchy and permissions
 */
export const ADMIN_ROLES = {
  admin: ['manage_users', 'manage_feedback', 'manage_content', 'view_analytics', 'manage_settings'],
  super_admin: ['manage_users', 'manage_feedback', 'manage_content', 'view_analytics', 'manage_settings', 'super_admin']
} as const

/**
 * Check if user has admin role
 */
export function isAdmin(role?: string): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Check if user has super admin role
 */
export function isSuperAdmin(role?: string): boolean {
  return role === 'super_admin'
}

/**
 * Check if user has specific admin permission
 */
export function hasAdminPermission(
  userRole?: string, 
  userPermissions?: string[], 
  requiredPermission?: AdminPermission
): boolean {
  if (!userRole || !isAdmin(userRole)) return false
  
  // Super admin has all permissions
  if (isSuperAdmin(userRole)) return true
  
  // Check role-based permissions
  const rolePermissions = ADMIN_ROLES[userRole as keyof typeof ADMIN_ROLES] || []
  if (requiredPermission && requiredPermission !== 'super_admin' && rolePermissions.includes(requiredPermission)) return true
  
  // Check explicit user permissions
  if (userPermissions && requiredPermission && userPermissions.includes(requiredPermission)) {
    return true
  }
  
  return false
}

/**
 * Admin middleware for protecting admin routes
 */
export async function adminMiddleware(
  req: NextRequest,
  requiredPermission?: AdminPermission
): Promise<NextResponse | null> {
  try {
    // Get the JWT token from the request
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token) {
      // Not authenticated - redirect to sign in
      const locale = req.nextUrl.pathname.split('/')[1] || 'en'
      const signInUrl = new URL(`/${locale}/auth/signin`, req.url)
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
    
    // Handle fallback users
    if ((token as any).isFallbackUser) {
      console.log('[AdminMiddleware] Processing fallback user:', token.email)
      const userRole = (token as any).role
      const userPermissions = (token as any).adminPermissions as string[]
      
      // Check if user is admin
      if (!isAdmin(userRole)) {
        return createUnauthorizedResponse(req)
      }
      
      // Check specific permission if required
      if (requiredPermission && !hasAdminPermission(userRole, userPermissions, requiredPermission)) {
        return createForbiddenResponse(req)
      }
      
      // Fallback user has required permissions, allow access
      console.log('[AdminMiddleware] Fallback user authorized:', token.email)
      return null
    }
    
    // We need to fetch fresh user data since JWT doesn't include role by default
    // This would normally be done in the auth callback, but we'll handle it here
    const userId = token.sub
    if (!userId) {
      return createUnauthorizedResponse(req)
    }
    
    // In a production app, you might want to cache this or include it in the JWT
    // For now, we'll assume the session callback has already populated the role
    const userRole = (token as any).role
    const userPermissions = (token as any).adminPermissions as string[]
    
    // Check if user is admin
    if (!isAdmin(userRole)) {
      return createUnauthorizedResponse(req)
    }
    
    // Check specific permission if required
    if (requiredPermission && !hasAdminPermission(userRole, userPermissions, requiredPermission)) {
      return createForbiddenResponse(req)
    }
    
    // User has required permissions, allow access
    return null
  } catch (error) {
    console.error('Admin middleware error:', error)
    return createUnauthorizedResponse(req)
  }
}

/**
 * Create unauthorized response (redirect to login)
 */
function createUnauthorizedResponse(req: NextRequest): NextResponse {
  const locale = req.nextUrl.pathname.split('/')[1] || 'en'
  const signInUrl = new URL(`/${locale}/auth/signin`, req.url)
  signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
  return NextResponse.redirect(signInUrl)
}

/**
 * Create forbidden response (insufficient permissions)
 */
function createForbiddenResponse(req: NextRequest): NextResponse {
  const locale = req.nextUrl.pathname.split('/')[1] || 'en'
  const forbiddenUrl = new URL(`/${locale}/dashboard?error=insufficient_permissions`, req.url)
  return NextResponse.redirect(forbiddenUrl)
}

/**
 * Utility function to wrap admin route handlers
 */
export function withAdminAuth<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse,
  requiredPermission?: AdminPermission
) {
  return async (...args: T) => {
    const req = args[0] as NextRequest
    
    const authResult = await adminMiddleware(req, requiredPermission)
    if (authResult) {
      return authResult
    }
    
    return handler(...args)
  }
}

/**
 * Admin route configuration
 */
export const ADMIN_ROUTES = {
  dashboard: { path: '/admin', permission: undefined }, // Basic admin access
  users: { path: '/admin/users', permission: 'manage_users' as AdminPermission },
  feedback: { path: '/admin/feedback', permission: 'manage_feedback' as AdminPermission },
  content: { path: '/admin/content', permission: 'manage_content' as AdminPermission },
  analytics: { path: '/admin/analytics', permission: 'view_analytics' as AdminPermission },
  settings: { path: '/admin/settings', permission: 'manage_settings' as AdminPermission },
} as const