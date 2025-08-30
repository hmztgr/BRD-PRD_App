require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSchema() {
  try {
    // Get table info using raw query
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `
    
    console.log('Current users table schema:')
    console.table(result)
    
  } catch (error) {
    console.error('Error checking schema:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()