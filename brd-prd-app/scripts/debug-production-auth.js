#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: { 
      url: 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres'
    }
  }
});

async function debugAuth() {
  try {
    console.log('🔍 Debugging production authentication...\n');
    
    // 1. Check all tables that exist
    console.log('1. 📋 Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('Tables:', tables.map(t => t.table_name).join(', '));
    
    // 2. Check User table structure
    console.log('\n2. 🔧 Checking User table structure...');
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND table_schema = 'public';
    `;
    console.log('User columns:');
    userColumns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // 3. Check admin user details
    console.log('\n3. 👤 Admin user details...');
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' }
    });
    
    if (admin) {
      console.log('✅ Admin found:');
      Object.keys(admin).forEach(key => {
        if (key === 'password') {
          console.log(`   ${key}: [REDACTED] (${admin[key] ? 'exists' : 'null'})`);
        } else {
          console.log(`   ${key}: ${JSON.stringify(admin[key])}`);
        }
      });
    }
    
    // 4. Check if there are any other users with admin emails
    console.log('\n4. 🔍 Checking all users with admin emails...');
    const adminUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@smartdocs.ai', 'hamza@smartdocs.ai']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        adminPermissions: true,
        subscriptionTier: true
      }
    });
    
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`   ${user.email}: permissions=${JSON.stringify(user.adminPermissions)}, tier=${user.subscriptionTier}`);
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();