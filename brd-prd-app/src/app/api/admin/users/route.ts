import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hasAdminPermission, logAdminActivity } from '@/lib/admin-auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/users - List users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    
    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const subscriptionTier = searchParams.get('subscriptionTier') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (subscriptionTier) {
      whereClause.subscriptionTier = subscriptionTier.toUpperCase() as any;
    }

    // Get users and total count in parallel
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          adminPermissions: true,
          subscriptionTier: true,
          tokensUsed: true,
          tokensLimit: true,
          createdAt: true,
          updatedAt: true,
          companyName: true,
          industry: true,
          language: true,
          _count: {
            select: {
              documents: true,
              referredUsers: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Add role field to users (role is determined by adminPermissions or email)
    const usersWithRole = users.map(user => ({
      ...user,
      subscriptionTier: user.subscriptionTier.toLowerCase(),
      role: (user.adminPermissions && Array.isArray(user.adminPermissions) && user.adminPermissions.length > 0) 
        ? 'admin' 
        : user.email === 'admin@smartdocs.ai' ? 'admin' : 'user'
    }));

    await logAdminActivity(
      adminUser.id,
      'view_users',
      undefined,
      { page, limit, search, role, subscriptionTier }
    );

    return NextResponse.json({
      users: usersWithRole,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(req: NextRequest) {
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
      password,
      role = 'user',
      subscriptionTier = 'FREE',
      companyName,
      industry,
      language = 'en'
    } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Set token limits based on subscription tier
    const tokenLimits = {
      free: 10000,
      professional: 100000,
      business: 500000,
      enterprise: 1000000
    };

    // Create user using Prisma
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subscriptionTier: subscriptionTier.toUpperCase() as any,
        tokensLimit: tokenLimits[subscriptionTier as keyof typeof tokenLimits] || 10000,
        companyName,
        industry,
        language,
        emailVerified: new Date() // Set email as verified for admin-created users
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        createdAt: true
      }
    });

    await logAdminActivity(
      adminUser.id,
      'create_user',
      user.id,
      { email, role, subscriptionTier }
    );

    // Add role field and convert subscriptionTier to lowercase
    const userWithRole = {
      ...user,
      subscriptionTier: user.subscriptionTier.toLowerCase(),
      role: role || 'user'
    };

    return NextResponse.json({
      success: true,
      user: userWithRole
    }, { status: 201 });

  } catch (error: any) {
    console.error('Admin users POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}

// PUT /api/admin/users - Update existing user
export async function PUT(req: NextRequest) {
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
      id,
      name,
      email,
      role,
      subscriptionTier,
      tokensLimit,
      companyName,
      industry,
      language
    } = body;

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (subscriptionTier !== undefined) {
      updateData.subscriptionTier = subscriptionTier.toUpperCase();
    }
    if (tokensLimit !== undefined) updateData.tokensLimit = tokensLimit;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (industry !== undefined) updateData.industry = industry;
    if (language !== undefined) updateData.language = language;

    // Update user using Prisma
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        adminPermissions: true,
        subscriptionTier: true,
        tokensUsed: true,
        tokensLimit: true,
        createdAt: true,
        updatedAt: true,
        companyName: true,
        industry: true,
        language: true
      }
    });

    await logAdminActivity(
      adminUser.id,
      'update_user',
      updatedUser.id,
      { changes: Object.keys(updateData) }
    );

    // Add role field and convert subscriptionTier to lowercase
    const userWithRole = {
      ...updatedUser,
      subscriptionTier: updatedUser.subscriptionTier.toLowerCase(),
      role: (updatedUser.adminPermissions && Array.isArray(updatedUser.adminPermissions) && updatedUser.adminPermissions.length > 0) 
        ? 'admin' 
        : updatedUser.email === 'admin@smartdocs.ai' ? 'admin' : 'user'
    };

    return NextResponse.json({
      success: true,
      user: userWithRole
    });

  } catch (error: any) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Admin access required' ? 401 : 500 }
    );
  }
}