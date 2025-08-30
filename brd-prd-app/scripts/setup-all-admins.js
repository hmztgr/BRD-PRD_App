#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Database URLs
const databases = {
  production: 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres',
  development: process.env.DEV_DATABASE_URL || 'file:./dev.db'
};

async function setupAdmin(dbUrl, envName) {
  console.log(`\n🔧 Setting up admin for ${envName}...`);
  console.log(`   Database: ${dbUrl.substring(0, 50)}...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    }
  });
  
  try {
    const email = 'admin@smartdocs.ai';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`   ✅ User exists, updating...`);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'admin',
          adminPermissions: [
            'manage_users',
            'manage_content',
            'view_analytics', 
            'manage_billing',
            'manage_settings'
          ],
          subscriptionTier: 'PROFESSIONAL',
          subscriptionStatus: 'ACTIVE'
        }
      });
      console.log(`   ✅ Admin updated!`);
    } else {
      console.log(`   📝 Creating new admin user...`);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'System Admin',
          role: 'admin',
          emailVerified: new Date(),
          referralCode: 'ADMIN_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          adminPermissions: [
            'manage_users',
            'manage_content',
            'view_analytics',
            'manage_billing',
            'manage_settings'
          ],
          subscriptionTier: 'PROFESSIONAL',
          subscriptionStatus: 'ACTIVE'
        }
      });
      console.log(`   ✅ Admin created!`);
    }
    
    // Verify the user can authenticate
    const verifyUser = await prisma.user.findUnique({
      where: { email }
    });
    
    const passwordValid = await bcrypt.compare(password, verifyUser.password);
    console.log(`   🔐 Password verification: ${passwordValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   👤 Role: ${verifyUser.role}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Setting up admin users for all environments...');
  
  // Get development database URL from command line or use default
  if (process.argv[2]) {
    databases.development = process.argv[2];
  }
  
  // Setup production admin
  await setupAdmin(databases.production, 'PRODUCTION');
  
  // Setup development admin if URL provided
  if (databases.development !== 'file:./dev.db') {
    await setupAdmin(databases.development, 'DEVELOPMENT');
  } else {
    console.log('\n⚠️  Development database URL not provided');
    console.log('   Usage: node setup-all-admins.js "postgresql://..."');
  }
  
  console.log('\n✅ Admin setup complete!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@smartdocs.ai');
  console.log('   Password: admin123');
}

main();