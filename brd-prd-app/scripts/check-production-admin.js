#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Production database URL
const productionUrl = 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres';

const prisma = new PrismaClient({
  datasources: {
    db: { url: productionUrl }
  }
});

async function checkProductionAdmin() {
  try {
    console.log('🔍 Checking production database...');
    
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        adminPermissions: true,
        subscriptionTier: true,
        createdAt: true
      }
    });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Has password: ${admin.password ? 'Yes' : 'No'}`);
      console.log(`   Admin permissions: ${JSON.stringify(admin.adminPermissions)}`);
      console.log(`   Subscription tier: ${admin.subscriptionTier}`);
      console.log(`   Created: ${admin.createdAt}`);
    } else {
      console.log('❌ Admin user NOT found in production database');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionAdmin();