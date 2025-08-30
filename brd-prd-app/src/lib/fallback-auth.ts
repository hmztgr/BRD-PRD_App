import bcrypt from 'bcryptjs'

/**
 * Emergency fallback admin user configuration
 * Used when primary database is unavailable
 */
const EMERGENCY_ADMIN_USER = {
  id: 'emergency-admin-fallback',
  email: 'admin@smartdocs.ai',
  password: 'admin123', // Plain text password for emergency use
  name: 'Emergency Admin',
  role: 'super_admin',
  adminPermissions: [
    'manage_users',
    'manage_feedback', 
    'manage_content',
    'view_analytics',
    'manage_settings',
    'super_admin'
  ],
  subscriptionTier: 'professional',
  subscriptionStatus: 'active'
}

/**
 * In-memory fallback user store
 * Only contains the emergency admin user
 */
const fallbackUsers = new Map([
  [EMERGENCY_ADMIN_USER.email, EMERGENCY_ADMIN_USER]
])

/**
 * Fallback authentication function
 * Used when database connection fails
 */
export async function authenticateFallbackUser(
  email: string, 
  password: string
): Promise<any | null> {
  console.log('[FallbackAuth] Attempting fallback authentication for:', email)
  
  // Only allow the emergency admin user
  if (email !== EMERGENCY_ADMIN_USER.email) {
    console.log('[FallbackAuth] Email not authorized for fallback auth:', email)
    return null
  }
  
  const user = fallbackUsers.get(email)
  if (!user) {
    console.log('[FallbackAuth] User not found in fallback store:', email)
    return null
  }
  
  // Check password (plain text comparison for emergency use)
  if (password !== user.password) {
    console.log('[FallbackAuth] Invalid password for fallback user:', email)
    return null
  }
  
  console.log('[FallbackAuth] Fallback authentication successful for:', email)
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: null,
    role: user.role,
    adminPermissions: user.adminPermissions,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    isFallbackUser: true // Mark as fallback user
  }
}

/**
 * Check if database is available
 * Used to determine when to use fallback auth
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    // Try to import and test database connection
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.log('[FallbackAuth] Database unavailable:', error.message)
    return false
  }
}

/**
 * Get fallback user session data
 * Used in JWT and session callbacks
 */
export function getFallbackUserSession(email: string) {
  const user = fallbackUsers.get(email)
  if (!user) return null
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    adminPermissions: user.adminPermissions,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    isFallbackUser: true
  }
}

/**
 * Check if a user ID belongs to a fallback user
 */
export function isFallbackUserId(userId: string): boolean {
  return userId === EMERGENCY_ADMIN_USER.id
}

/**
 * Get emergency admin credentials for testing
 */
export function getEmergencyAdminCredentials() {
  return {
    email: EMERGENCY_ADMIN_USER.email,
    password: EMERGENCY_ADMIN_USER.password
  }
}