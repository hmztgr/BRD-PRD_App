require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSubscriptionTiers() {
  try {
    console.log('Fixing uppercase subscription tiers to lowercase...')
    
    // Update ENTERPRISE to enterprise  
    await prisma.$executeRaw`
      UPDATE users 
      SET "subscriptionTier" = 'enterprise' 
      WHERE "subscriptionTier" = 'ENTERPRISE'
    `
    
    // Update PROFESSIONAL to professional
    await prisma.$executeRaw`
      UPDATE users 
      SET "subscriptionTier" = 'professional' 
      WHERE "subscriptionTier" = 'PROFESSIONAL'
    `
    
    // Update any other uppercase values
    await prisma.$executeRaw`
      UPDATE users 
      SET "subscriptionTier" = 'business' 
      WHERE "subscriptionTier" = 'BUSINESS'
    `
    
    await prisma.$executeRaw`
      UPDATE users 
      SET "subscriptionTier" = 'free' 
      WHERE "subscriptionTier" = 'FREE'
    `
    
    console.log('✅ Subscription tiers fixed successfully!')
    
    // Show updated counts
    const result = await prisma.$queryRaw`
      SELECT "subscriptionTier", COUNT(*) as count 
      FROM users 
      GROUP BY "subscriptionTier"
    `
    
    console.log('Current subscription tier distribution:')
    console.table(result)
    
  } catch (error) {
    console.error('Error fixing subscription tiers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSubscriptionTiers()