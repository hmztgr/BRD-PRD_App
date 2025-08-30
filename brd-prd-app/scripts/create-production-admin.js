#!/usr/bin/env node

/**
 * Create Admin User in Production Database
 * This script connects directly to the production PostgreSQL database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Production database URL
const productionUrl = 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres';

const prisma = new PrismaClient({
  datasources: {
    db: { url: productionUrl }
  }
});

async function createProductionAdmin() {
  try {
    console.log('🔧 Connecting to production database...');
    
    const email = 'admin@smartdocs.ai';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingAdmin) {
      console.log('👤 Admin user exists, updating password...');
      await prisma.user.update({
        where: { email },
        data: {
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
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('👤 Creating new admin user...');
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'System Admin',
          adminPermissions: [
            'manage_users',
            'manage_content', 
            'view_analytics',
            'manage_billing',
            'manage_settings'
          ],
          emailVerified: new Date(),
          referralCode: 'ADMIN_' + Math.random().toString(36).substring(2, 8).toUpperCase()
        }
      });
      console.log('✅ Admin user created successfully!');
    }
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();