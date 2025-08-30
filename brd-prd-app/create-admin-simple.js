require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 Creating admin user...')

    const adminEmail = 'admin@test.com'
    const adminPassword = 'Admin123!'

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existing) {
      // Update existing user to admin
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'super_admin', // This should be the Supabase role column
          adminPermissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system'],
          is_super_admin: true
        }
      })
      console.log('✅ Existing user updated to admin!')
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          emailVerified: new Date(),
          role: 'super_admin',
          adminPermissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system'],
          is_super_admin: true,
          subscriptionTier: 'enterprise',
          subscriptionStatus: 'active',
          tokensLimit: 1000000,
          tokensUsed: 0
        }
      })
      console.log('✅ New admin user created!')
    }

    console.log('\n🔐 Admin Credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\n🚀 Access admin panel:')
    console.log('1. Sign in at: http://localhost:3000/en/auth/signin')
    console.log('2. Use credentials above')
    console.log('3. Navigate to: http://localhost:3000/en/admin')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Details:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()