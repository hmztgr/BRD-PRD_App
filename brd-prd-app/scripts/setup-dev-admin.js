#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Try both direct and pooler connections
const urls = [
  'postgresql://postgres:ZUhcQ9WyOuNwu8FI@db.jmfkzfmripuzfspijndq.supabase.co:5432/postgres',
  'postgresql://postgres.jmfkzfmripuzfspijndq:ZUhcQ9WyOuNwu8FI@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
];

let devUrl = urls[0];

async function setupDevAdmin() {
  console.log('🚀 Setting up admin user for development database...\n');
  
  let prisma;
  let connected = false;
  
  // Try each URL
  for (const url of urls) {
    console.log(`Trying connection: ${url.substring(0, 50)}...`);
    prisma = new PrismaClient({
      datasources: {
        db: { url }
      }
    });
    
    try {
      await prisma.$connect();
      console.log('✅ Connected successfully!\n');
      devUrl = url;
      connected = true;
      break;
    } catch (err) {
      console.log('❌ Failed to connect with this URL\n');
      await prisma.$disconnect();
    }
  }
  
  if (!connected) {
    console.log('Could not connect to development database with any URL');
    return;
  }
  
  try {
    
    const email = 'admin@smartdocs.ai';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Try to find existing user
    console.log('Checking for existing admin user...');
    const existingUser = await prisma.user.findUnique({
      where: { email }
    }).catch(err => {
      console.log('User table might not exist yet');
      return null;
    });
    
    if (existingUser) {
      console.log('Updating existing admin user...');
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
          ]
        }
      });
      console.log('✅ Admin user updated!');
    } else {
      console.log('Creating new admin user...');
      
      // First check if table exists and has any users
      const userCount = await prisma.user.count().catch(() => 0);
      console.log(`Current users in database: ${userCount}`);
      
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
      console.log('✅ Admin user created!');
    }
    
    console.log('\n📝 Admin credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ Development admin setup complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('P2002')) {
      console.log('User already exists with that email');
    } else if (error.message.includes('P2021')) {
      console.log('The table `User` does not exist in the current database');
      console.log('\n🔧 You need to run migrations first:');
      console.log('   npx prisma migrate deploy');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\nAuthentication failed. Please check:');
      console.log('1. The database password is correct');
      console.log('2. The Supabase project ID is correct');
      console.log('3. Connection pooling is enabled in Supabase');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupDevAdmin();