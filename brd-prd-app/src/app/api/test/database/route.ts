import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[DatabaseTest] Starting database connection test...');
  
  try {
    // Test 1: Environment variable check
    const dbUrl = process.env.DATABASE_URL;
    console.log('[DatabaseTest] DATABASE_URL exists:', !!dbUrl);
    console.log('[DatabaseTest] DATABASE_URL preview:', dbUrl?.substring(0, 30) + '...');
    
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        tests: {
          envVar: false,
          prismaImport: false,
          connection: false
        }
      });
    }
    
    // Test 2: Prisma import
    console.log('[DatabaseTest] Importing Prisma...');
    const { prisma } = await import('@/lib/prisma');
    console.log('[DatabaseTest] Prisma imported successfully');
    
    // Test 3: Database connection
    console.log('[DatabaseTest] Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[DatabaseTest] Database query successful:', result);
    
    // Test 4: User table check
    console.log('[DatabaseTest] Testing user table...');
    const userCount = await prisma.user.count();
    console.log('[DatabaseTest] User count:', userCount);
    
    // Test 5: Admin user check
    console.log('[DatabaseTest] Checking admin user...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' },
      select: {
        id: true,
        email: true,
        name: true,
        systemRole: true
      }
    });
    console.log('[DatabaseTest] Admin user found:', !!adminUser, adminUser);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tests: {
        envVar: true,
        prismaImport: true,
        connection: true,
        userTable: true,
        adminUser: !!adminUser
      },
      data: {
        userCount,
        adminUser: adminUser ? {
          email: adminUser.email,
          name: adminUser.name,
          systemRole: adminUser.systemRole
        } : null,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[DatabaseTest] Database test failed:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 300)
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      tests: {
        envVar: !!process.env.DATABASE_URL,
        prismaImport: false,
        connection: false
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}