#!/usr/bin/env node

/**
 * Production Build Test
 * Tests if the application can build successfully for production deployment
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Starting Production Build Test...\n');

// Check prerequisites
console.log('1. 📋 Checking Prerequisites...');

const requiredFiles = [
  'package.json',
  'next.config.ts', 
  'tsconfig.json',
  'src/app/layout.tsx'
];

let prerequisitesPassed = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} missing`);
    prerequisitesPassed = false;
  }
});

if (!prerequisitesPassed) {
  console.log('\n❌ Prerequisites check failed. Cannot proceed with build test.');
  process.exit(1);
}

// Check .next directory and clean if exists
console.log('\n2. 🧹 Cleaning Previous Build...');
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('   🗑️  Removing previous .next directory...');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('   ✅ Previous build cleaned');
  } catch (error) {
    console.log(`   ⚠️  Warning: Could not clean .next directory: ${error.message}`);
  }
} else {
  console.log('   ✅ No previous build to clean');
}

// Run the build
console.log('\n3. 🚀 Running Production Build...');
console.log('   Command: npm run build');
console.log('   This may take several minutes...\n');

const startTime = Date.now();

const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'pipe',
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'production' }
});

let buildOutput = '';
let buildError = '';
let buildCompleted = false;
let buildExitCode = null;

buildProcess.stdout.on('data', (data) => {
  const output = data.toString();
  buildOutput += output;
  
  // Show key progress indicators
  if (output.includes('Creating an optimized production build')) {
    console.log('   🔄 Creating optimized build...');
  }
  if (output.includes('Compiled successfully')) {
    console.log('   ✅ Compilation successful');
  }
  if (output.includes('Checking validity of types')) {
    console.log('   🔍 Type checking...');
  }
  if (output.includes('Linting')) {
    console.log('   🔍 Linting...');
  }
  if (output.includes('Creating Pages')) {
    console.log('   📄 Creating pages...');
  }
  if (output.includes('Generating static pages')) {
    console.log('   📊 Generating static pages...');
  }
});

buildProcess.stderr.on('data', (data) => {
  const error = data.toString();
  buildError += error;
  
  // Show critical errors immediately
  if (error.includes('Error:') || error.includes('Failed to')) {
    console.log(`   ❌ ${error.trim()}`);
  }
});

buildProcess.on('close', (code) => {
  buildExitCode = code;
  buildCompleted = true;
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  console.log(`\n⏱️  Build completed in ${duration} seconds`);
  console.log(`📊 Exit code: ${code}`);
  
  if (code === 0) {
    console.log('✅ BUILD SUCCESSFUL!');
    
    // Verify build artifacts
    console.log('\n4. 🔍 Verifying Build Artifacts...');
    
    const expectedArtifacts = [
      '.next/static',
      '.next/server',
      '.next/BUILD_ID'
    ];
    
    let allArtifactsPresent = true;
    
    expectedArtifacts.forEach(artifact => {
      const fullPath = path.join(process.cwd(), artifact);
      if (fs.existsSync(fullPath)) {
        console.log(`   ✅ ${artifact}`);
      } else {
        console.log(`   ❌ ${artifact} missing`);
        allArtifactsPresent = false;
      }
    });
    
    // Check build size
    try {
      const buildId = fs.readFileSync('.next/BUILD_ID', 'utf8').trim();
      console.log(`   📦 Build ID: ${buildId}`);
    } catch (error) {
      console.log('   ⚠️  Could not read BUILD_ID');
    }
    
    console.log('\n🎯 Production Build Test Results:');
    console.log('==================================');
    console.log(`✅ Build Status: SUCCESS`);
    console.log(`⏱️  Build Time: ${duration}s`);
    console.log(`📊 Exit Code: ${code}`);
    console.log(`🗂️  Artifacts: ${allArtifactsPresent ? 'Complete' : 'Incomplete'}`);
    
    if (allArtifactsPresent) {
      console.log('\n🚀 DEPLOYMENT READY!');
      console.log('The application has successfully built for production.');
      console.log('\nNext steps:');
      console.log('- Deploy to your hosting platform');
      console.log('- Run smoke tests in production environment');
      console.log('- Monitor application performance');
    } else {
      console.log('\n⚠️  Build artifacts incomplete. Check build logs.');
    }
    
  } else {
    console.log(`❌ BUILD FAILED with exit code ${code}`);
    
    console.log('\n📝 Build Output (last 50 lines):');
    console.log('=================================');
    const outputLines = buildOutput.split('\n').slice(-50);
    outputLines.forEach(line => {
      if (line.trim()) console.log(`   ${line}`);
    });
    
    if (buildError) {
      console.log('\n🚨 Build Errors:');
      console.log('================');
      const errorLines = buildError.split('\n').slice(-20);
      errorLines.forEach(line => {
        if (line.trim()) console.log(`   ${line}`);
      });
    }
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('- Check TypeScript errors above');
    console.log('- Verify all environment variables are set');
    console.log('- Check for missing dependencies');
    console.log('- Run npm install to update dependencies');
  }
  
  process.exit(code);
});

// Handle timeout (5 minutes max)
setTimeout(() => {
  if (!buildCompleted) {
    console.log('\n⏰ Build timeout after 5 minutes');
    console.log('Terminating build process...');
    buildProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (!buildCompleted) {
        buildProcess.kill('SIGKILL');
      }
    }, 5000);
    
    console.log('\n❌ BUILD TIMED OUT');
    console.log('The build took longer than expected and was terminated.');
    process.exit(1);
  }
}, 5 * 60 * 1000); // 5 minutes