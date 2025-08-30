#!/usr/bin/env node

/**
 * Simple Admin User Creation Script
 * Creates an admin user matching the current schema
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSimpleAdmin() {
  try {
    console.log('Creating simple admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@smartdocs.ai' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, updating role...');
      
      const updatedAdmin = await prisma.user.update({
        where: { email: 'admin@smartdocs.ai' },
        data: {
          role: 'admin',
          subscriptionTier: 'ENTERPRISE',
          isEmailVerified: true,
          tokensLimit: 1000000,
          name: 'Admin User'
        }
      });

      console.log('✅ Admin user updated:', {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
        subscriptionTier: updatedAdmin.subscriptionTier
      });
    } else {
      console.log('Creating new admin user...');
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@smartdocs.ai',
          name: 'Admin User',
          role: 'admin',
          subscriptionTier: 'ENTERPRISE',
          isEmailVerified: true,
          tokensLimit: 1000000,
          referralCode: 'ADMIN001'
        }
      });

      console.log('✅ Admin user created:', {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        subscriptionTier: newAdmin.subscriptionTier
      });
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('📝 Note: This app uses NextAuth with OAuth providers.');
    console.log('   The admin role is assigned based on the email address.');
    console.log('   Use Google OAuth to sign in with admin@smartdocs.ai');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleAdmin();