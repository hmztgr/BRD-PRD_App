const { Client } = require('pg')
const bcrypt = require('bcryptjs')

async function createAdminDirectly() {
  // Use the same DATABASE_URL from .env.local
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:9W94C3SF1ixO7L4C@db.nutehrmyxqyzhfppsknk.supabase.co:5432/postgres'
  
  const client = new Client({
    connectionString
  })
  
  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    
    console.log('🔐 Hashing password...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    console.log('👤 Creating/updating admin user...')
    
    // First, check if user exists
    const checkUser = await client.query('SELECT id, email FROM "users" WHERE email = $1', ['admin@smartdocs.ai'])
    
    if (checkUser.rows.length > 0) {
      console.log('📝 Updating existing user...')
      // Update existing user
      const updateQuery = `
        UPDATE "users" 
        SET 
          password = $1,
          role = 'admin',
          "emailVerified" = NOW(),
          "adminPermissions" = $2
        WHERE email = $3
        RETURNING id, email, name, role
      `
      
      const adminPermissions = JSON.stringify([
        'manage_users',
        'manage_feedback', 
        'manage_content',
        'manage_subscriptions',
        'view_analytics',
        'manage_settings'
      ])
      
      const result = await client.query(updateQuery, [hashedPassword, adminPermissions, 'admin@smartdocs.ai'])
      console.log('✅ Admin user updated:', result.rows[0])
      
    } else {
      console.log('🆕 Creating new user...')
      // Create new user
      const insertQuery = `
        INSERT INTO "users" (
          email, name, password, role, 
          "subscriptionTier", "subscriptionStatus", 
          "tokensUsed", "tokensLimit", "emailVerified",
          "adminPermissions", "referralCode"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10
        ) RETURNING id, email, name, role
      `
      
      const adminPermissions = JSON.stringify([
        'manage_users',
        'manage_feedback', 
        'manage_content',
        'manage_subscriptions',
        'view_analytics',
        'manage_settings'
      ])
      
      const referralCode = 'admin_' + Math.random().toString(36).substring(2, 15)
      
      const result = await client.query(insertQuery, [
        'admin@smartdocs.ai',
        'Admin User',
        hashedPassword,
        'admin',
        'FREE',
        'active',
        0,
        50000,
        adminPermissions,
        referralCode
      ])
      
      console.log('✅ Admin user created:', result.rows[0])
    }
    
    console.log('\n🎉 SUCCESS!')
    console.log('📧 Email: admin@smartdocs.ai')
    console.log('🔒 Password: admin123')
    console.log('🌐 Login at: http://localhost:3001/en/auth/signin')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code) {
      console.error('Error Code:', error.code)
    }
  } finally {
    await client.end()
  }
}

createAdminDirectly()