require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 Creating admin user (simple approach)...')

    const adminEmail = 'admin@test.com'
    const adminPassword = 'Admin123!'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Try creating with basic fields only
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        emailVerified: new Date(),
        // Try using the role field from Prisma schema
        role: 'super_admin',
        adminPermissions: ['manage_users', 'manage_feedback', 'manage_content']
      }
    })

    console.log('✅ Admin user created!')
    console.log('\n🔐 Credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\n🚀 Test admin access at: http://localhost:3000/en/admin')
    
  } catch (error) {
    console.error('❌ Error details:', error.message)
    
    // If role field fails, let's try creating a basic user first
    try {
      console.log('\n⚠️  Trying basic user creation...')
      const basicUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@test.com',
          password: hashedPassword,
          emailVerified: new Date()
        }
      })
      console.log('✅ Basic user created. You can manually update in database.')
      console.log('Email: admin@test.com')
      console.log('Password: Admin123!')
    } catch (basicError) {
      console.error('❌ Basic creation failed:', basicError.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()