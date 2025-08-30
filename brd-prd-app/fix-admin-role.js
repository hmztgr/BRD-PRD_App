require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixAdminRole() {
  try {
    const adminEmail = 'admin@smartdocs.ai'
    
    console.log('🔧 Fixing admin user role...')
    
    // Update the role to uppercase ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminPermissions: true,
        emailVerified: true
      }
    })
    
    console.log('✅ Admin user role updated:')
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      adminPermissions: updatedUser.adminPermissions,
      emailVerified: !!updatedUser.emailVerified
    })
    
    console.log('🎉 Admin user now has proper ADMIN role!')
    
  } catch (error) {
    console.error('❌ Error fixing admin role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminRole()