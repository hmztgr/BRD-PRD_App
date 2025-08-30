#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: { 
      url: 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres'
    }
  }
});

async function fixAdminRole() {
  try {
    console.log('🔧 Fixing admin user role...');
    
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@smartdocs.ai' },
      data: {
        role: 'admin'  // Change from 'user' to 'admin'
      },
      select: {
        id: true,
        email: true,
        role: true,
        adminPermissions: true
      }
    });
    
    console.log('✅ Admin role updated successfully!');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Admin Permissions: ${JSON.stringify(updatedUser.adminPermissions)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole();