#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const databases = {
  production: {
    name: 'PRODUCTION (nutehrmyxqyzhfppsknk)',
    url: 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres'
  }
};

async function checkDatabase(dbConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Checking ${dbConfig.name}`);
  console.log('='.repeat(60));
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbConfig.url }
    }
  });
  
  try {
    // Check connection
    await prisma.$connect();
    console.log('✅ Connected successfully\n');
    
    // Check what tables exist
    console.log('📋 Tables in database:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tableNames = tables.map(t => t.table_name);
    console.log('   Found tables:', tableNames.join(', '));
    
    // Check different possible user tables
    const userTables = ['User', 'users', 'user'];
    
    for (const tableName of userTables) {
      try {
        const count = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        console.log(`\n📊 Table "${tableName}":`);
        console.log(`   Total records: ${count[0].count}`);
        
        // Get admin users
        const admins = await prisma.$queryRawUnsafe(
          `SELECT id, email, role, "createdAt" FROM "${tableName}" WHERE email = 'admin@smartdocs.ai' OR role = 'admin' LIMIT 5`
        );
        
        if (admins.length > 0) {
          console.log('   Admin users found:');
          admins.forEach(admin => {
            console.log(`     - ${admin.email} (role: ${admin.role}, created: ${admin.createdAt})`);
          });
        } else {
          console.log('   No admin users found in this table');
        }
      } catch (err) {
        // Table doesn't exist or has different structure
      }
    }
    
    // Check the Prisma User model specifically
    console.log('\n🔍 Checking Prisma User model:');
    try {
      const userCount = await prisma.user.count();
      console.log(`   Total users: ${userCount}`);
      
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@smartdocs.ai' }
      });
      
      if (adminUser) {
        console.log('   ✅ Admin user found:');
        console.log(`      ID: ${adminUser.id}`);
        console.log(`      Email: ${adminUser.email}`);
        console.log(`      Role: ${adminUser.role}`);
        console.log(`      Created: ${adminUser.createdAt}`);
      } else {
        console.log('   ❌ Admin user NOT found via Prisma');
      }
      
      // List all users
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, createdAt: true },
        take: 10
      });
      
      if (allUsers.length > 0) {
        console.log('\n   All users in database:');
        allUsers.forEach(user => {
          console.log(`     - ${user.email} (${user.role}) - ${user.createdAt.toISOString()}`);
        });
      }
      
    } catch (err) {
      console.log('   Error accessing User model:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🔍 Checking both databases for admin user...\n');
  console.log('Looking for: admin@smartdocs.ai');
  
  // Check production
  await checkDatabase(databases.production);
  
  console.log('\n' + '='.repeat(60));
  console.log('IMPORTANT NOTES:');
  console.log('='.repeat(60));
  console.log('\n1. In Supabase, there are TWO different user systems:');
  console.log('   - auth.users: Supabase Auth users (not used by your app)');
  console.log('   - public.User: Your app\'s custom users table (this is what NextAuth uses)');
  console.log('\n2. Make sure you\'re looking at:');
  console.log('   Table Editor → public schema → User table (capital U)');
  console.log('   NOT the Authentication → Users section');
  console.log('\n3. Your app uses the custom User table with NextAuth');
}

main();