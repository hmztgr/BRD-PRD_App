const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Creating admin user...');
  
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
    
    console.log('Admin user created/updated successfully!');
    console.log('Email:', admin.email);
    console.log('ID:', admin.id);
    
    // Verify the user exists and can be queried
    const foundUser = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminPermissions: true,
        subscriptionTier: true
      }
    });
    
    console.log('Verification - Found user:', foundUser);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();