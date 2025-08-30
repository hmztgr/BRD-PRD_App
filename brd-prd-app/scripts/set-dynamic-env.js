const fs = require('fs');
const path = require('path');

// Get port from command line arguments or environment
const port = process.argv[2] || process.env.PORT || 3000;

// Read current .env.local
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
}

// Update URLs with current port
const updatedContent = envContent
  .replace(/NEXTAUTH_URL=http:\/\/localhost:\d+/g, `NEXTAUTH_URL=http://localhost:${port}`)
  .replace(/APP_URL=http:\/\/localhost:\d+/g, `APP_URL=http://localhost:${port}`);

// Write back to .env.local
fs.writeFileSync(envPath, updatedContent);

console.log(`✓ Updated .env.local with port ${port}`);