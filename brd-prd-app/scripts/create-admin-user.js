const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('Creating admin test user...')

    // Admin user credentials
    const adminEmail = 'admin@test.com'
    const adminPassword = 'Admin123!'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('Admin user already exists!')
      console.log('Email:', adminEmail)
      console.log('Password:', adminPassword)
      console.log('Role:', existingAdmin.role)
      return
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'super_admin',
        adminPermissions: [
          'manage_users',
          'manage_feedback', 
          'manage_content',
          'manage_subscriptions',
          'view_analytics',
          'manage_system'
        ],
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
        tokensLimit: 1000000 // 1M tokens for admin
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('')
    console.log('🔐 Admin Login Credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('Role:', adminUser.role)
    console.log('')
    console.log('🚀 You can now access admin panel at:')
    console.log('- English: http://localhost:3000/en/admin')
    console.log('- Arabic: http://localhost:3000/ar/admin')
    console.log('')
    console.log('📝 Login steps:')
    console.log('1. Go to http://localhost:3000/en/auth/signin')
    console.log('2. Use the credentials above')
    console.log('3. After login, navigate to /en/admin')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()