require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 Creating admin user...')

    const adminEmail = 'admin@test.com'
    const adminPassword = 'Admin123!'

    // Check if user exists (only select fields that exist)
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true }
    })

    if (existing) {
      // Update existing user to admin using fields that exist
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          is_super_admin: true,
          adminPermissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system']
        }
      })
      console.log('✅ Existing user updated to admin!')
    } else {
      // Create new user with fields that exist
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          emailVerified: new Date(),
          is_super_admin: true,
          adminPermissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system'],
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
    console.log('\n📝 Login Instructions:')
    console.log('1. Go to: http://localhost:3000/en/auth/signin')
    console.log('2. Enter the email and password above')
    console.log('3. After login, navigate to: http://localhost:3000/en/admin')
    console.log('\n🚀 Admin URLs:')
    console.log('- Dashboard: http://localhost:3000/en/admin')
    console.log('- Users: http://localhost:3000/en/admin/users')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code === 'P2002') {
      console.log('ℹ️  User might already exist. Try updating existing user manually.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()