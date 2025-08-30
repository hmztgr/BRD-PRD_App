#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: { 
      url: 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres'
    }
  }
});

async function identifyProject() {
  try {
    console.log('🔍 Identifying Supabase project details...\n');
    
    // Parse the connection URL to extract project details
    const dbUrl = 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres';
    const urlParts = dbUrl.match(/postgresql:\/\/(.+):(.+)@(.+):(\d+)\/(.+)/);
    
    if (urlParts) {
      const [, user, password, host, port, database] = urlParts;
      const projectId = host.replace('db.', '').replace('.supabase.co', '');
      
      console.log('📊 Connection Details:');
      console.log(`   Host: ${host}`);
      console.log(`   Project ID: ${projectId}`);
      console.log(`   Database: ${database}`);
      console.log(`   Port: ${port}`);
      
      console.log('\n🔗 Supabase Dashboard URLs:');
      console.log(`   Main Dashboard: https://supabase.com/dashboard/project/${projectId}`);
      console.log(`   Database: https://supabase.com/dashboard/project/${projectId}/editor`);
      console.log(`   Auth Users: https://supabase.com/dashboard/project/${projectId}/auth/users`);
      console.log(`   Table Editor: https://supabase.com/dashboard/project/${projectId}/editor`);
    }
    
    // Try to get some basic info from the database
    console.log('\n📋 Database Info:');
    
    const totalUsers = await prisma.user.count();
    console.log(`   Total Users: ${totalUsers}`);
    
    const adminUsers = await prisma.user.count({
      where: { role: 'admin' }
    });
    console.log(`   Admin Users: ${adminUsers}`);
    
    const recentUsers = await prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('\n👥 Recent Users:');
    recentUsers.forEach(user => {
      console.log(`   ${user.email} (${user.role}) - ${user.createdAt.toDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

identifyProject();