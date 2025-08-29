require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setAdminPassword() {
  try {
    const adminEmail = 'admin@smartdocs.ai'
    const newPassword = 'admin123' // Simple password for testing - change in production!
    
    console.log(`Setting password for admin user: ${adminEmail}`)
    console.log(`New password will be: ${newPassword}`)
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    // Update the admin user's password
    await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE email = ${adminEmail}
    `
    
    console.log('✅ Admin password updated successfully!')
    console.log(`You can now login with:`)
    console.log(`Email: ${adminEmail}`)
    console.log(`Password: ${newPassword}`)
    
  } catch (error) {
    console.error('Error setting admin password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setAdminPassword()