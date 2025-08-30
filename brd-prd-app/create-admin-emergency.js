const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function createEmergencyAdmin() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Creating emergency admin user...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartdocs.ai' },
      update: {
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
        adminPermissions: [
          'manage_users',
          'manage_feedback', 
          'manage_content',
          'manage_subscriptions',
          'view_analytics',
          'manage_settings'
        ]
      },
      create: {
        email: 'admin@smartdocs.ai',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'active',
        tokensUsed: 0,
        tokensLimit: 50000,
        emailVerified: new Date(),
        adminPermissions: [
          'manage_users',
          'manage_feedback', 
          'manage_content',
          'manage_subscriptions',
          'view_analytics',
          'manage_settings'
        ]
      }
    })
    
    console.log('✅ Admin user created/updated successfully!')
    console.log('📧 Email:', admin.email)
    console.log('🔒 Password: admin123')
    console.log('👤 Role:', admin.role)
    console.log('🔑 Permissions:', admin.adminPermissions)
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    
    if (error.code === 'P1001') {
      console.error('Database connection failed. Please check DATABASE_URL in .env.local')
    }
  } finally {
    await prisma.$disconnect()
  }
}

createEmergencyAdmin()