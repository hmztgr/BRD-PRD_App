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

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Skip role filtering since role column doesn't exist in Supabase setup
    // if (role) {
    //   where.role = role;
    // }

    if (subscriptionTier) {
      where.subscriptionTier = subscriptionTier;
    }

    // Simple query to get all users first, then handle filtering in app
    let query = `
      SELECT 
        id, name, email, "emailVerified", "adminPermissions", 
        "subscriptionTier", "subscriptionStatus", "tokensUsed", "tokensLimit",
        "createdAt", "updatedAt", "companyName", industry, language
      FROM users
    `;
    
    const conditions = [];
    const params = [];
    
    if (search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 2} OR "companyName" ILIKE $${params.length + 3})`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (subscriptionTier) {
      conditions.push(`"subscriptionTier" = $${params.length + 1}`);
      params.push(subscriptionTier.toUpperCase());
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY "${sortBy}" ${sortOrder} LIMIT ${limit} OFFSET ${skip}`;
    
    const [usersResult, totalCountResult] = await Promise.all([
      prisma.$queryRawUnsafe(query, ...params),
      prisma.$queryRaw`SELECT COUNT(*) as count FROM users`
    ]);
    
    const users = usersResult as any[];
    const totalCount = parseInt((totalCountResult as any[])[0]?.count || '0');

    const totalPages = Math.ceil(totalCount / limit);

    // Add role and document counts (role is determined by adminPermissions or email)
    // Also convert uppercase enum values to lowercase
    const usersWithRole = users.map(user => ({
      ...user,
      subscriptionTier: (user.subscriptionTier as string)?.toLowerCase() || 'free',
      role: (user.adminPermissions && Array.isArray(user.adminPermissions) && user.adminPermissions.length > 0) 
        ? 'admin' 
        : user.email === 'admin@smartdocs.ai' ? 'admin' : 'user',
      _count: {
        documents: Math.floor(Math.random() * 20), // Mock document count
        referrals: Math.floor(Math.random() * 5) // Mock referral count
      }
    }))

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
      subscriptionTier = 'free',
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

    // Create user using raw query to handle enum mismatch
    const dbSubscriptionTier = subscriptionTier.toUpperCase();
    
    await prisma.$executeRaw`
      INSERT INTO users (
        name, email, password, "subscriptionTier", "tokensLimit", 
        "companyName", industry, language, "emailVerified", "createdAt", "updatedAt"
      ) VALUES (
        ${name}, ${email}, ${hashedPassword}, ${dbSubscriptionTier}::usertier, 
        ${tokenLimits[subscriptionTier as keyof typeof tokenLimits] || 10000},
        ${companyName}, ${industry}, ${language}, NOW(), NOW(), NOW()
      )
    `;
    
    // Get the created user
    const userResult = await prisma.$queryRaw`
      SELECT id, name, email, "subscriptionTier", "createdAt"
      FROM users 
      WHERE email = ${email}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    
    const user = (userResult as any[])[0];

    await logAdminActivity(
      adminUser.id,
      'create_user',
      user.id,
      { email, role, subscriptionTier }
    );

    // Add role field manually and convert subscriptionTier to lowercase
    const userWithRole = {
      ...user,
      subscriptionTier: (user.subscriptionTier as string)?.toLowerCase() || 'free',
      role: role || 'user'
    }

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