require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkEnumValues() {
  try {
    // Check what enum values are available for UserTier
    const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'UserTier'
      );
    `
    
    console.log('Available UserTier enum values:')
    console.table(result)
    
    // Check current subscription tier usage
    const usage = await prisma.$queryRaw`
      SELECT "subscriptionTier", COUNT(*) as count 
      FROM users 
      GROUP BY "subscriptionTier"
    `
    
    console.log('\nCurrent subscription tier usage:')
    console.table(usage)
    
  } catch (error) {
    console.error('Error checking enum values:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEnumValues()