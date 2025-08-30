require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAdminRole() {
  try {
    const adminEmail = 'admin@smartdocs.ai'
    
    const user = await prisma.$queryRaw`
      SELECT id, name, email, role, password, "adminPermissions", "emailVerified"
      FROM users 
      WHERE email = ${adminEmail}
      LIMIT 1
    `
    
    if (user && user.length > 0) {
      console.log('Admin user details:')
      console.log({
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        role: user[0].role,
        hasPassword: !!user[0].password,
        passwordHash: user[0].password ? user[0].password.substring(0, 20) + '...' : null,
        adminPermissions: user[0].adminPermissions,
        emailVerified: user[0].emailVerified
      })
      
      // Check if the role should be ADMIN
      if (user[0].role === 'ADMIN') {
        console.log('✅ User role is ADMIN')
      } else if (user[0].role === 'admin') {
        console.log('⚠️ User role is lowercase "admin", should be "ADMIN"')
      } else {
        console.log('❌ User role is:', user[0].role, '(should be "ADMIN")')
      }
      
    } else {
      console.log('Admin user not found')
    }
    
  } catch (error) {
    console.error('Error checking admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminRole()