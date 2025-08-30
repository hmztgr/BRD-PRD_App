require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

async function makeUserAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🔗 Connected to database')

    // Get the first user in the database
    const usersResult = await client.query('SELECT id, name, email FROM users LIMIT 5')
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database')
      console.log('📝 Please create a user account first:')
      console.log('1. Go to: http://localhost:3000/en/auth/signup')
      console.log('2. Create account with email: admin@test.com')
      console.log('3. Run this script again')
      return
    }

    console.log('👥 Found users:')
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'})`)
    })

    // Let's make the first user an admin (or you can specify an email)
    const targetEmail = 'admin@test.com' // Change this if needed
    let targetUser = usersResult.rows.find(u => u.email === targetEmail)
    
    if (!targetUser) {
      console.log(`⚠️  User with email ${targetEmail} not found`)
      console.log('🔄 Making the first user admin instead...')
      targetUser = usersResult.rows[0]
    }

    console.log(`🎯 Making user admin: ${targetUser.email}`)

    // Update user to have admin permissions
    await client.query(`
      UPDATE users 
      SET "adminPermissions" = $1
      WHERE id = $2
    `, [
      JSON.stringify([
        'manage_users', 
        'manage_feedback', 
        'manage_content', 
        'manage_subscriptions', 
        'view_analytics', 
        'manage_system'
      ]),
      targetUser.id
    ])

    console.log('✅ User updated to admin!')
    console.log('\n🔐 Admin User Details:')
    console.log('Email:', targetUser.email)
    console.log('Name:', targetUser.name || 'Not set')
    console.log('\n🚀 Next steps:')
    console.log('1. Login at: http://localhost:3000/en/auth/signin')
    console.log('2. Use the email above with your existing password')
    console.log('3. Navigate to: http://localhost:3000/en/admin')
    console.log('4. You should now have admin access!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

makeUserAdmin()