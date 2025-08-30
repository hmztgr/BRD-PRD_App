require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTables() {
  try {
    // Get all table names
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    
    console.log('Available tables:')
    console.table(tables)
    
    // Check specifically for user-related tables
    const userTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%'
      ORDER BY table_name;
    `
    
    console.log('\nUser-related tables:')
    console.table(userTables)
    
  } catch (error) {
    console.error('Error checking tables:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()