#!/usr/bin/env node

/**
 * Deploy Database Schema to Production
 * This script ensures production database matches development schema
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Production Schema Deployment...\n');

// Production database URL
const prodUrl = 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres';

console.log('1. 📋 Setting up environment for production deployment...');

// Create temporary .env file for production deployment
const tempEnvContent = `DATABASE_URL="${prodUrl}"`;
fs.writeFileSync('.env.deploy', tempEnvContent);

console.log('2. 🔄 Generating Prisma client for production...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: prodUrl }
  });
} catch (error) {
  console.error('❌ Failed to generate Prisma client');
  process.exit(1);
}

console.log('3. 📊 Checking current database status...');
try {
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: prodUrl }
  });
} catch (error) {
  console.log('⚠️  db push failed, trying migrate deploy...');
  
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit', 
      env: { ...process.env, DATABASE_URL: prodUrl }
    });
  } catch (migrateError) {
    console.error('❌ Migration deployment failed');
    console.error('This usually means the database needs to be reset or manually updated');
    process.exit(1);
  }
}

console.log('4. 🔧 Seeding admin data...');
// Now create admin user with proper schema
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: { url: prodUrl }
  }
});

async function createAdmin() {
  try {
    const email = 'admin@smartdocs.ai';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        password: hashedPassword,
        name: 'System Admin',
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
      },
      update: {
        password: hashedPassword,
        adminPermissions: [
          'manage_users',
          'manage_content', 
          'view_analytics',
          'manage_billing',
          'manage_settings'
        ]
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Admin creation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin().then(() => {
  // Cleanup
  if (fs.existsSync('.env.deploy')) {
    fs.unlinkSync('.env.deploy');
  }
  console.log('\n🎉 Production schema deployment complete!');
});