const net = require('net');
const { spawn } = require('child_process');

// Port range configuration
const MIN_PORT = 3000;
const MAX_PORT = 3009;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

async function findAvailablePort() {
  for (let port = MIN_PORT; port <= MAX_PORT; port++) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }
  return null;
}

async function startDev() {
  const port = await findAvailablePort();
  
  if (!port) {
    console.error(`❌ No available ports in range ${MIN_PORT}-${MAX_PORT}`);
    process.exit(1);
  }
  
  console.log(`🚀 Starting development server on port ${port}...`);
  
  // Check if we should use custom domain or localhost
  const useCustomDomain = process.env.USE_CUSTOM_DOMAIN === 'true';
  const scriptName = useCustomDomain ? 'setup-local-domain.js' : 'set-dynamic-env.js';
  
  // Update .env.local with the current port
  const updateEnv = spawn('node', [`scripts/${scriptName}`, port.toString()], {
    stdio: 'inherit',
    shell: true
  });
  
  updateEnv.on('close', (envCode) => {
    if (envCode === 0) {
      // Start environment validation
      const child = spawn('npm', ['run', 'env:validate'], { 
        stdio: 'inherit', 
        shell: true 
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          // If validation passes, start Next.js
          const nextProcess = spawn('npx', ['next', 'dev', '--port', port.toString()], {
            stdio: 'inherit',
            shell: true
          });
          
          nextProcess.on('close', (nextCode) => {
            process.exit(nextCode);
          });
        } else {
          process.exit(code);
        }
      });
    } else {
      console.error('Failed to update environment variables');
      process.exit(envCode);
    }
  });
}

startDev().catch(console.error);