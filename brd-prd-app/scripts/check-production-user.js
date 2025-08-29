#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Try multiple possible production URLs
const urls = [
  'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres',
  'postgresql://postgres.nutehrmyxqyzhfppsknk:9W94C3SF1ixO7L4C@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
];

async function checkUser(databaseUrl, urlName) {
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } }
  });
  
  try {
    console.log(`\n🔍 Checking ${urlName}...`);
    
    // Check if admin exists and get their details
    const user = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' }
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`   Admin Permissions: ${JSON.stringify(user.adminPermissions)}`);
      console.log(`   Subscription Tier: ${user.subscriptionTier}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      return true;
    } else {
      console.log('❌ User not found');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error connecting to ${urlName}:`, error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  for (let i = 0; i < urls.length; i++) {
    const found = await checkUser(urls[i], `Database ${i + 1}`);
    if (found) {
      console.log(`\n✅ Active database found: Database ${i + 1}`);
      break;
    }
  }
}

main();