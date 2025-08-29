require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 Creating admin user...')

    const adminData = {
      name: 'Admin User',
      email: 'admin@test.com',
      password: await bcrypt.hash('Admin123!', 12),
      emailVerified: new Date(),
      role: 'super_admin',
      adminPermissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system'],
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
      tokensLimit: 1000000
    }

    // Try to find existing user first
    const existing = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (existing) {
      // Update existing user to admin
      const updated = await prisma.user.update({
        where: { email: adminData.email },
        data: {
          role: 'super_admin',
          adminPermissions: adminData.adminPermissions
        }
      })
      console.log('✅ Existing user updated to admin!')
      console.log('Email:', adminData.email)
      console.log('Password: Admin123!')
    } else {
      // Create new admin user
      const admin = await prisma.user.create({
        data: adminData
      })
      console.log('✅ New admin user created!')
      console.log('Email:', adminData.email)
      console.log('Password: Admin123!')
    }

    console.log('\n🚀 Admin access:')
    console.log('- English: http://localhost:3000/en/admin')
    console.log('- Arabic: http://localhost:3000/ar/admin')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()