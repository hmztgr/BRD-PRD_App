import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/admin/users/[id] - Get user details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdmin();
    
    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            documents: true,
            referrals: true,
            usageHistory: true,
            payments: true
          }
        },
        usageHistory: {
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            id: true,
            date: true,
            tokensUsed: true,
            operation: true,
            aiModel: true,
            success: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await logAdminActivity(
      adminUser.id,
      'view_user_details',
      params.id
    );

    return NextResponse.json({ user });

  } catch (error: any) {
    console.error('Admin user GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdmin();
    
    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      role,
      subscriptionTier,
      subscriptionStatus,
      tokensLimit,
      companyName,
      industry,
      language,
      password
    } = body;

    // Prevent self-demotion from super_admin
    if (adminUser.id === params.id && adminUser.role === 'super_admin' && role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot demote yourself from super_admin role' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (tokensLimit !== undefined) updateData.tokensLimit = parseInt(tokensLimit);
    if (companyName !== undefined) updateData.companyName = companyName;
    if (industry !== undefined) updateData.industry = industry;
    if (language !== undefined) updateData.language = language;

    // Handle password update
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12);
    } else if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        tokensUsed: true,
        tokensLimit: true,
        updatedAt: true
      }
    });

    await logAdminActivity(
      adminUser.id,
      'update_user',
      params.id,
      { updatedFields: Object.keys(updateData) }
    );

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error: any) {
    console.error('Admin user PUT error:', error);
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
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

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdmin();
    
    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (adminUser.id === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only super_admin can delete other admins
    if (user.role !== 'user' && adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super_admin can delete admin users' },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id }
    });

    await logAdminActivity(
      adminUser.id,
      'delete_user',
      params.id,
      { email: user.email, role: user.role }
    );

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('Admin user DELETE error:', error);
    
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