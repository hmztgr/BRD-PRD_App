#!/usr/bin/env node

/**
 * Initialize Development Database with Admin User
 * Run this to set up your development Supabase database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// IMPORTANT: Update this with your actual Supabase connection string
// Get it from: https://supabase.com/dashboard/project/jmfkzfmripuzfspijndq/settings/database
// Look for "Connection string" -> URI (not pooling mode)
const DATABASE_URL = process.env.DEV_DATABASE_URL || process.argv[2];

if (!DATABASE_URL || DATABASE_URL === 'undefined') {
  console.log('❌ Please provide the database URL');
  console.log('\nUsage:');
  console.log('  node init-dev-database.js "postgresql://postgres:[password]@db.jmfkzfmripuzfspijndq.supabase.co:5432/postgres"');
  console.log('\nGet your connection string from:');
  console.log('  https://supabase.com/dashboard/project/jmfkzfmripuzfspijndq/settings/database');
  console.log('  Look for: Connection string → URI (Mode: Session)');
  process.exit(1);
}

async function initDatabase() {
  console.log('🚀 Initializing development database...\n');
  console.log('Using URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...\n');

  const prisma = new PrismaClient({
    datasources: {
      db: { url: DATABASE_URL }
    }
  });

  try {
    // Test connection
    console.log('1. Testing connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database\n');

    // Push schema to database (create tables)
    console.log('2. Creating database schema...');
    const { execSync } = require('child_process');
    
    // Set DATABASE_URL for prisma commands
    process.env.DATABASE_URL = DATABASE_URL;
    
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      console.log('   ✅ Schema created\n');
    } catch (err) {
      console.log('   ⚠️  Schema might already exist\n');
    }

    // Create admin user
    console.log('3. Creating admin user...');
    const email = 'admin@smartdocs.ai';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    }).catch(() => null);

    if (existingUser) {
      console.log('   Updating existing admin...');
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
      console.log('   ✅ Admin updated\n');
    } else {
      console.log('   Creating new admin...');
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'System Admin',
          role: 'admin',
          emailVerified: new Date(),
          referralCode: 'ADMIN_DEV',
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
      console.log('   ✅ Admin created\n');
    }

    // Verify
    console.log('4. Verifying setup...');
    const admin = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true }
    });
    
    console.log('   ✅ Admin verified:', admin);

    console.log('\n' + '='.repeat(50));
    console.log('✅ DEVELOPMENT DATABASE INITIALIZED!');
    console.log('='.repeat(50));
    console.log('\n📝 Admin Credentials:');
    console.log('   Email: admin@smartdocs.ai');
    console.log('   Password: admin123');
    console.log('\n🔗 Development URL:');
    console.log('   https://smart-business-docs-ai-dev.vercel.app/');
    console.log('\n⚙️  Add this to Vercel Environment Variables:');
    console.log('   DATABASE_URL=' + DATABASE_URL);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\nConnection failed. Please check:');
      console.log('1. Your database password is correct');
      console.log('2. Get the correct connection string from Supabase:');
      console.log('   https://supabase.com/dashboard/project/jmfkzfmripuzfspijndq/settings/database');
    }
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();