require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAdminUser() {
  try {
    const adminEmail = 'admin@smartdocs.ai'
    
    const user = await prisma.$queryRaw`
      SELECT id, name, email, password, "adminPermissions", "emailVerified"
      FROM users 
      WHERE email = ${adminEmail}
      LIMIT 1
    `
    
    if (user && user.length > 0) {
      console.log('Admin user found:')
      console.log({
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        hasPassword: !!user[0].password,
        passwordHash: user[0].password ? user[0].password.substring(0, 20) + '...' : null,
        adminPermissions: user[0].adminPermissions,
        emailVerified: user[0].emailVerified
      })
    } else {
      console.log('Admin user not found')
    }
    
  } catch (error) {
    console.error('Error checking admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminUser()