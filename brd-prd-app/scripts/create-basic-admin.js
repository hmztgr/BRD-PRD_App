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

async function createBasicAdmin() {
  try {
    console.log('🔧 Connecting to production database...');
    
    const email = 'admin@smartdocs.ai';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create with only basic fields that definitely exist
    const admin = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        password: hashedPassword,
        name: 'System Admin',
        emailVerified: new Date(),
        referralCode: 'ADMIN_' + Math.random().toString(36).substring(2, 8).toUpperCase()
      },
      update: {
        password: hashedPassword,
        name: 'System Admin'
      }
    });
    
    console.log('✅ Admin user created/updated successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 User ID: ${admin.id}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicAdmin();