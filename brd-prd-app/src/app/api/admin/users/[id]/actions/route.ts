import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasAdminPermission, logAdminActivity, AdminPermission } from '@/lib/admin-auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/admin/users/[id]/actions - User actions (suspend, activate, change role, etc.)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdmin();
    
    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, ...actionData } = body;
    const { id } = await params;

    // Prevent actions on self
    if (adminUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot perform actions on your own account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, email: true, role: true, subscriptionStatus: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let result: any = {};
    let logDetails: any = { action };

    switch (action) {
      case 'suspend':
        // Only super_admin can suspend other admins
        if (user.role !== 'user' && adminUser.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Only super_admin can suspend admin users' },
            { status: 403 }
          );
        }

        result = await prisma.user.update({
          where: { id: id },
          data: {
            subscriptionStatus: 'canceled'
          }
        });
        logDetails.reason = actionData.reason || 'No reason provided';
        break;

      case 'activate':
        result = await prisma.user.update({
          where: { id: id },
          data: {
            subscriptionStatus: 'active'
          }
        });
        break;

      case 'change_role':
        const { newRole } = actionData;
        
        if (!newRole || !['user', 'admin', 'super_admin'].includes(newRole)) {
          return NextResponse.json(
            { error: 'Invalid role specified' },
            { status: 400 }
          );
        }

        // Only super_admin can promote to admin roles or change admin roles
        if ((newRole !== 'user' || user.role !== 'user') && adminUser.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Only super_admin can manage admin roles' },
            { status: 403 }
          );
        }

        result = await prisma.user.update({
          where: { id: id },
          data: {
            role: newRole
          }
        });
        logDetails.oldRole = user.role;
        logDetails.newRole = newRole;
        break;

      case 'set_permissions':
        const { permissions } = actionData;
        
        if (!Array.isArray(permissions)) {
          return NextResponse.json(
            { error: 'Permissions must be an array' },
            { status: 400 }
          );
        }

        // Validate permissions
        const validPermissions: AdminPermission[] = [
          'manage_users',
          'manage_feedback',
          'manage_content',
          'manage_subscriptions',
          'view_analytics',
          'manage_system'
        ];

        const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
        if (invalidPermissions.length > 0) {
          return NextResponse.json(
            { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
            { status: 400 }
          );
        }

        result = await prisma.user.update({
          where: { id: id },
          data: {
            adminPermissions: permissions
          }
        });
        logDetails.permissions = permissions;
        break;

      case 'reset_tokens':
        result = await prisma.user.update({
          where: { id: id },
          data: {
            tokensUsed: 0
          }
        });
        break;

      case 'adjust_tokens':
        const { tokensLimit: newLimit } = actionData;
        
        if (!newLimit || newLimit < 0) {
          return NextResponse.json(
            { error: 'Invalid token limit' },
            { status: 400 }
          );
        }

        result = await prisma.user.update({
          where: { id: id },
          data: {
            tokensLimit: parseInt(newLimit)
          }
        });
        logDetails.newTokensLimit = newLimit;
        break;

      case 'verify_email':
        result = await prisma.user.update({
          where: { id: id },
          data: {
            emailVerified: new Date()
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    await logAdminActivity(
      adminUser.id,
      `user_${action}`,
      id,
      logDetails
    );

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        subscriptionStatus: result.subscriptionStatus,
        tokensUsed: result.tokensUsed,
        tokensLimit: result.tokensLimit,
        emailVerified: result.emailVerified
      }
    });

  } catch (error: any) {
    console.error('Admin user actions error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}