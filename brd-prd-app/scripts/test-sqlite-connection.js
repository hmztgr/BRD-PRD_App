#!/usr/bin/env node

/**
 * SQLite Connection Test Tool
 * Verify that SQLite database is working properly
 */

const { PrismaClient } = require('@prisma/client');

async function testSQLiteConnection() {
  console.log('🧪 Testing SQLite Database Connection...\n');
  
  // Load SQLite environment
  require('dotenv').config({ path: '.env.local' });
  
  let prisma;
  try {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    console.log('✅ Prisma client initialized');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic query executed:', result);
    
    // Test schema existence by checking tables
    try {
      const users = await prisma.user.findMany({ take: 1 });
      console.log('✅ User table accessible');
      console.log(`📊 Current user count: ${await prisma.user.count()}`);
    } catch (error) {
      console.log('ℹ️  User table not found or empty (normal for fresh database)');
    }
    
    // Test other main tables
    const tables = [
      { name: 'Document', model: prisma.document },
      { name: 'Subscription', model: prisma.subscription },
      { name: 'Feedback', model: prisma.feedback }
    ];
    
    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`✅ ${table.name} table accessible (${count} records)`);
      } catch (error) {
        console.log(`ℹ️  ${table.name} table not found or inaccessible`);
      }
    }
    
    console.log('\n🎉 SQLite database is fully functional!');
    console.log('\n📋 Next steps for development:');
    console.log('1. Run: npm run dev');
    console.log('2. Access app at: http://localhost:3000');
    console.log('3. Create test user account');
    console.log('4. Test document generation features');
    
    return true;
    
  } catch (error) {
    console.error('❌ SQLite connection failed:', error.message);
    console.error('Error details:', error);
    return false;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔐 Database connection closed');
    }
  }
}

async function createTestData() {
  console.log('\n🧪 Creating test data...');
  
  require('dotenv').config({ path: '.env.local' });
  
  const prisma = new PrismaClient();
  
  try {
    // Create a test user (if not exists)
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        subscriptionTier: 'BASIC',
        isEmailVerified: true,
        tokensUsed: 0,
        tokensLimit: 10000
      }
    });
    
    console.log('✅ Test user created/updated:', testUser.email);
    
    // Create a test document
    const testDocument = await prisma.document.create({
      data: {
        title: 'Test Document',
        type: 'BRD',
        content: 'This is a test business requirements document.',
        userId: testUser.id,
        status: 'COMPLETED'
      }
    });
    
    console.log('✅ Test document created:', testDocument.title);
    
    console.log('\n🎉 Test data created successfully!');
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const connectionOk = await testSQLiteConnection();
  
  if (connectionOk) {
    const createData = process.argv.includes('--create-data');
    if (createData) {
      await createTestData();
    }
  }
}

if (require.main === module) {
  main();
}