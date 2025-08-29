const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Setting up development database...');

try {
  // Push the database schema
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Database schema pushed successfully!');
} catch (error) {
  console.error('Error setting up database:', error.message);
  process.exit(1);
}