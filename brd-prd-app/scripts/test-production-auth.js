#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: { 
      url: 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres'
    }
  }
});

async function testAuth() {
  try {
    console.log('🔐 Testing production authentication...\n');
    
    const email = 'admin@smartdocs.ai';
    const password = 'admin123';
    
    console.log(`1. Checking user: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        adminPermissions: true,
        subscriptionTier: true,
        subscriptionStatus: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   Role: ${user.role}`);
    console.log(`   Admin Permissions: ${JSON.stringify(user.adminPermissions)}`);
    console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
    
    console.log(`\n2. Testing password: ${password}`);
    if (!user.password) {
      console.log('❌ User has no password set');
      return;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`Password valid: ${isValid ? '✅ Yes' : '❌ No'}`);
    
    if (!isValid) {
      console.log('\n🔧 Fixing password...');
      const newHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: { password: newHash }
      });
      console.log('✅ Password updated');
    }
    
    console.log('\n3. Final verification...');
    const updatedUser = await prisma.user.findUnique({
      where: { email }
    });
    
    const finalCheck = await bcrypt.compare(password, updatedUser.password);
    console.log(`Final password check: ${finalCheck ? '✅ Valid' : '❌ Invalid'}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();