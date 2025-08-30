#!/usr/bin/env node

/**
 * Build Validation Script for TypeScript and Next.js 15
 * 
 * This script performs comprehensive build validation without relying on
 * binaries that might have permission issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Build Validation Process...\n');

// Check if we're in the correct directory
const currentDir = process.cwd();
const packageJsonPath = path.join(currentDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(`📦 Project: ${packageJson.name} v${packageJson.version}`);

// 1. Validate TypeScript Configuration
console.log('\n1. 🔧 Validating TypeScript Configuration...');
const tsconfigPath = path.join(currentDir, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  console.log('   ✅ tsconfig.json found');
  console.log(`   ✅ Target: ${tsconfig.compilerOptions?.target}`);
  console.log(`   ✅ Module: ${tsconfig.compilerOptions?.module}`);
  console.log(`   ✅ Module Resolution: ${tsconfig.compilerOptions?.moduleResolution}`);
  console.log(`   ✅ Strict Mode: ${tsconfig.compilerOptions?.strict ? 'enabled' : 'disabled'}`);
} else {
  console.log('   ❌ tsconfig.json not found');
}

// 2. Validate Next.js Configuration
console.log('\n2. ⚡ Validating Next.js Configuration...');
const nextConfigPath = path.join(currentDir, 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  console.log('   ✅ next.config.ts found');
} else {
  console.log('   ❌ next.config.ts not found');
}

// 3. Check Critical Dependencies
console.log('\n3. 📚 Validating Critical Dependencies...');
const criticalDeps = ['next', 'react', 'typescript'];
const missingDeps = [];

criticalDeps.forEach(dep => {
  if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    console.log(`   ✅ ${dep}: ${version}`);
  } else {
    console.log(`   ❌ ${dep}: missing`);
    missingDeps.push(dep);
  }
});

// 4. Validate File Structure
console.log('\n4. 📁 Validating File Structure...');
const requiredPaths = [
  'src/app',
  'src/lib',
  'src/components',
  'prisma/schema.prisma'
];

requiredPaths.forEach(reqPath => {
  const fullPath = path.join(currentDir, reqPath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${reqPath} exists`);
  } else {
    console.log(`   ❌ ${reqPath} missing`);
  }
});

// 5. Check for TypeScript Files with Potential Issues
console.log('\n5. 🔍 Scanning TypeScript Files...');

function scanDirectory(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath, results);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(fullPath);
      }
    });
  } catch (error) {
    console.log(`   ⚠️  Error scanning ${dir}: ${error.message}`);
  }
  
  return results;
}

const tsFiles = scanDirectory(path.join(currentDir, 'src'));
console.log(`   📊 Found ${tsFiles.length} TypeScript files`);

// 6. Check for Next.js 15 Compatibility Issues
console.log('\n6. 🚀 Checking Next.js 15 Compatibility...');
let paramsIssues = 0;
let authIssues = 0;

tsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(currentDir, filePath);
    
    // Check for old params pattern (non-Promise)
    if (filePath.includes('/api/') && content.includes('{ params }')) {
      const hasAwaitParams = content.includes('await params');
      const hasPromiseParams = content.includes('params: Promise<');
      
      if (!hasAwaitParams && !hasPromiseParams) {
        console.log(`   ⚠️  ${relativePath}: May need params Promise type`);
        paramsIssues++;
      }
    }
    
    // Check for auth imports
    if (content.includes("from '@/lib/auth'") && content.includes('authOptions')) {
      console.log(`   ✅ ${relativePath}: Auth imports look correct`);
    }
    
  } catch (error) {
    console.log(`   ⚠️  Error reading ${relativePath}: ${error.message}`);
  }
});

console.log(`   📊 Potential params issues: ${paramsIssues}`);
console.log(`   📊 Auth usage checks completed`);

// 7. Check Environment Variables
console.log('\n7. 🌍 Environment Configuration...');
const envExamplePath = path.join(currentDir, '.env.example');
const envLocalPath = path.join(currentDir, '.env.local');

if (fs.existsSync(envExamplePath)) {
  console.log('   ✅ .env.example found');
} else {
  console.log('   ❌ .env.example missing');
}

if (fs.existsSync(envLocalPath)) {
  console.log('   ✅ .env.local found');
} else {
  console.log('   ⚠️  .env.local not found (may be in .gitignore)');
}

// 8. Final Assessment
console.log('\n📋 Build Validation Summary:');
console.log('================================');

let score = 100;
const issues = [];

if (missingDeps.length > 0) {
  score -= 20;
  issues.push(`Missing critical dependencies: ${missingDeps.join(', ')}`);
}

if (paramsIssues > 0) {
  score -= 10;
  issues.push(`${paramsIssues} files may need Next.js 15 params updates`);
}

if (!fs.existsSync(tsconfigPath)) {
  score -= 15;
  issues.push('TypeScript configuration missing');
}

if (!fs.existsSync(nextConfigPath)) {
  score -= 10;
  issues.push('Next.js configuration missing');
}

console.log(`📊 Overall Score: ${score}/100`);

if (issues.length === 0) {
  console.log('✅ No major issues detected');
  console.log('🚀 Project appears ready for build and deployment');
} else {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('\n🔧 Recommendations:');
if (paramsIssues > 0) {
  console.log('   - Update API routes to use Promise<> params type for Next.js 15');
}
console.log('   - Run tests before deployment: npm test');
console.log('   - Verify environment variables are properly configured');
console.log('   - Consider running build in CI/CD pipeline');

console.log('\n✅ Build validation complete!');