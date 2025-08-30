const fs = require('fs');
const path = require('path');
const os = require('os');

const DOMAIN_NAME = 'local-smart-business-docs-ai';

function getHostsPath() {
  if (os.platform() === 'win32') {
    return 'C:\\Windows\\System32\\drivers\\etc\\hosts';
  } else {
    return '/etc/hosts';
  }
}

function addHostsEntry(port) {
  const hostsPath = getHostsPath();
  const entry = `127.0.0.1 ${DOMAIN_NAME}`;
  
  try {
    let hostsContent = '';
    if (fs.existsSync(hostsPath)) {
      hostsContent = fs.readFileSync(hostsPath, 'utf-8');
    }
    
    // Check if entry already exists
    if (!hostsContent.includes(DOMAIN_NAME)) {
      hostsContent += `\n# Smart Business Docs AI Local Development\n${entry}\n`;
      fs.writeFileSync(hostsPath, hostsContent);
      console.log(`✓ Added ${DOMAIN_NAME} to hosts file`);
    } else {
      console.log(`✓ ${DOMAIN_NAME} already exists in hosts file`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update hosts file. Run as administrator/sudo:', error.message);
    return false;
  }
}

function updateEnvironmentForCustomDomain(port) {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update URLs with custom domain
  const updatedContent = envContent
    .replace(/NEXTAUTH_URL=http:\/\/localhost:\d+/g, `NEXTAUTH_URL=http://${DOMAIN_NAME}:${port}`)
    .replace(/APP_URL=http:\/\/localhost:\d+/g, `APP_URL=http://${DOMAIN_NAME}:${port}`);

  fs.writeFileSync(envPath, updatedContent);
  console.log(`✓ Updated .env.local to use ${DOMAIN_NAME}:${port}`);
}

function createPortFile(port) {
  const portFilePath = path.join(process.cwd(), '.dev-port');
  fs.writeFileSync(portFilePath, port.toString());
  console.log(`✓ Saved current port ${port} to .dev-port`);
}

// Get port from command line or environment
const port = process.argv[2] || process.env.PORT || 3000;

console.log(`🔧 Setting up local domain: ${DOMAIN_NAME}:${port}`);

// Add to hosts file
const hostsSuccess = addHostsEntry(port);

if (hostsSuccess) {
  // Update environment variables
  updateEnvironmentForCustomDomain(port);
  
  // Create port tracking file
  createPortFile(port);
  
  console.log(`\n🎉 Setup complete!`);
  console.log(`\nYou can now access your app at:`);
  console.log(`   http://${DOMAIN_NAME}:${port}`);
  console.log(`\nNote: You may need to restart your browser to see the changes.`);
} else {
  console.log(`\n⚠️  Hosts file update failed. You'll need to manually add:`);
  console.log(`   127.0.0.1 ${DOMAIN_NAME}`);
  console.log(`\nTo your hosts file as administrator.`);
}