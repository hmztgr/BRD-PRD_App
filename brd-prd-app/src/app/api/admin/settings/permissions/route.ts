import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, AdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// Permission templates for admin roles
const permissionTemplates = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system'] as AdminPermission[]
  },
  {
    id: '2',
    name: 'Content Manager',
    description: 'Manage content and view analytics',
    permissions: ['manage_content', 'view_analytics'] as AdminPermission[]
  },
  {
    id: '3',
    name: 'Support Admin',
    description: 'Handle user support and feedback',
    permissions: ['manage_feedback', 'manage_users', 'view_analytics'] as AdminPermission[]
  },
  {
    id: '4',
    name: 'Finance Admin',
    description: 'Manage subscriptions and view financial data',
    permissions: ['manage_subscriptions', 'view_analytics'] as AdminPermission[]
  },
  {
    id: '5',
    name: 'Analytics Viewer',
    description: 'View-only access to analytics and reports',
    permissions: ['view_analytics'] as AdminPermission[]
  }
]

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeUsers = searchParams.get('includeUsers') === 'true'

    let adminUsers = []

    if (includeUsers) {
      try {
        // Get all admin users with their current roles
        adminUsers = await prisma.user.findMany({
          where: {
            systemRole: {
              in: ['SUPER_ADMIN', 'SUB_ADMIN']
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            systemRole: true,
            createdAt: true,
            lastLogin: true
          },
          orderBy: { name: 'asc' }
        })
      } catch (error) {
        console.error('Error fetching admin users:', error)
        // Continue without user data if database query fails
      }
    }

    return NextResponse.json({
      success: true,
      templates: permissionTemplates,
      adminUsers
    })

  } catch (error) {
    console.error('Permission templates API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permission templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    // Only SUPER_ADMIN can create permission templates
    if (adminUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, permissions } = body

    // Validate required fields
    if (!name || !description || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, permissions' },
        { status: 400 }
      )
    }

    // Validate permissions
    const validPermissions: AdminPermission[] = [
      'manage_users',
      'manage_feedback', 
      'manage_content',
      'manage_subscriptions',
      'view_analytics',
      'manage_system'
    ]

    const invalidPerms = permissions.filter(p => !validPermissions.includes(p))
    if (invalidPerms.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPerms.join(', ')}` },
        { status: 400 }
      )
    }

    // TODO: Implement database storage for custom permission templates
    // For now, we'll just return the created template
    const newTemplate = {
      id: Date.now().toString(),
      name,
      description,
      permissions,
      createdBy: adminUser.email,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      template: newTemplate
    })

  } catch (error) {
    console.error('Permission template creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create permission template' },
      { status: 500 }
    )
  }
}