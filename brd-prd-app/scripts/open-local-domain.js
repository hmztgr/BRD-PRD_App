const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DOMAIN_NAME = 'local-smart-business-docs-ai';

function getCurrentPort() {
  const portFilePath = path.join(process.cwd(), '.dev-port');
  
  if (fs.existsSync(portFilePath)) {
    return fs.readFileSync(portFilePath, 'utf-8').trim();
  }
  
  return '3000'; // Default port
}

function openInBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    command = 'start';
  } else if (platform === 'darwin') {
    command = 'open';
  } else {
    command = 'xdg-open';
  }
  
  spawn(command, [url], { 
    stdio: 'ignore',
    detached: true,
    shell: true 
  }).unref();
}

const port = getCurrentPort();
const url = `http://${DOMAIN_NAME}:${port}`;

console.log(`🌐 Opening ${url}`);
openInBrowser(url);