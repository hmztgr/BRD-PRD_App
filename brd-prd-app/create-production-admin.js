const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use production DATABASE_URL environment variable
const prisma = new PrismaClient();

async function createProductionAdminUser() {
  console.log('Creating production admin user...');
  console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartdocs.ai' },
      update: {
        password: hashedPassword,
        role: 'admin',
        adminPermissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system']
      },
      create: {
        email: 'admin@smartdocs.ai',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        adminPermissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system'],
        referralCode: 'ADMIN001',
        subscriptionTier: 'ENTERPRISE',
        subscriptionStatus: 'active',
        emailVerified: new Date(),
        tokensLimit: 1000000
      }
    });
    
    console.log('✅ Production admin user created/updated successfully!');
    console.log('- Email:', admin.email);
    console.log('- ID:', admin.id);
    console.log('- Name:', admin.name);
    
    // Verify the user exists and can be queried
    const foundUser = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminPermissions: true,
        subscriptionTier: true,
        emailVerified: true
      }
    });
    
    console.log('✅ Verification - Found user in production DB:', foundUser);
    
    // Test password verification
    if (foundUser) {
      const userWithPassword = await prisma.user.findUnique({
        where: { email: 'admin@smartdocs.ai' },
        select: { password: true }
      });
      
      if (userWithPassword?.password) {
        const isValid = await bcrypt.compare('admin123', userWithPassword.password);
        console.log('🔐 Password verification test:', isValid ? '✅ VALID' : '❌ Invalid');
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating production admin user:', error);
    
    // Try to diagnose the issue
    if (error.message.includes('relation') || error.message.includes('table')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Run database migration: npx prisma db push');
      console.log('2. Check if DATABASE_URL points to correct database');
      console.log('3. Ensure database schema is up to date');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdminUser();