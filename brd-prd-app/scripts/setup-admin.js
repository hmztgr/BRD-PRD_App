require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupAdmin() {
  try {
    // Find a user to make admin (you can change this email)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartdocs.ai'
    
    console.log(`Setting up admin permissions for: ${adminEmail}`)
    
    // Use raw SQL to handle potential schema mismatch
    const existingUser = await prisma.$queryRaw`
      SELECT id, email, name FROM users WHERE email = ${adminEmail} LIMIT 1
    `
    
    let adminUser
    if (existingUser && existingUser.length > 0) {
      console.log('Admin user already exists, updating permissions...')
      // Update existing user with admin permissions
      await prisma.$executeRaw`
        UPDATE users 
        SET 
          "adminPermissions" = ${JSON.stringify([
            'manage_users',
            'manage_feedback', 
            'manage_content',
            'manage_subscriptions',
            'view_analytics',
            'manage_system'
          ])}::jsonb,
          "emailVerified" = NOW()
        WHERE email = ${adminEmail}
      `
      adminUser = existingUser[0]
    } else {
      console.log('Creating new admin user...')
      // Create new admin user
      await prisma.$executeRaw`
        INSERT INTO users (
          id, name, email, role, "adminPermissions", "emailVerified", 
          password, "createdAt", "updatedAt", "subscriptionTier", 
          "subscriptionStatus", "tokensUsed", "tokensLimit", 
          "billingCycle", "referralCode", "totalReferralTokens", 
          language, "systemRole"
        ) VALUES (
          ${require('crypto').randomUUID()},
          'Admin User',
          ${adminEmail},
          'admin',
          ${JSON.stringify([
            'manage_users',
            'manage_feedback', 
            'manage_content',
            'manage_subscriptions',
            'view_analytics',
            'manage_system'
          ])}::jsonb,
          NOW(),
          '$2a$12$dummy.hash.for.admin',
          NOW(),
          NOW(),
          'enterprise',
          'active',
          0,
          1000000,
          'monthly',
          ${require('crypto').randomUUID()},
          0,
          'en',
          'admin'
        )
      `
      
      // Get the created user
      const newUser = await prisma.$queryRaw`
        SELECT id, email, name FROM users WHERE email = ${adminEmail} LIMIT 1
      `
      adminUser = newUser[0]
    }
    
    console.log('Admin user setup completed:', {
      id: adminUser.id,
      email: adminUser.email,
      note: 'Admin permissions are hardcoded in the app for this email'
    })
    
  } catch (error) {
    console.error('Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()