#!/usr/bin/env node

/**
 * Database Connection Diagnostic Tool
 * Comprehensive testing for Supabase PostgreSQL connections
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  const line = '='.repeat(60);
  log(`\n${line}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(line, 'cyan');
}

async function testDatabaseConnection() {
  logSection('🚀 DATABASE CONNECTION DIAGNOSTIC TOOL');
  
  // 1. Environment Variables Check
  logSection('📋 ENVIRONMENT VARIABLES CHECK');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  let envIssues = [];
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      log(`❌ ${varName}: NOT SET`, 'red');
      envIssues.push(varName);
    } else {
      log(`✅ ${varName}: SET`, 'green');
      if (varName === 'DATABASE_URL') {
        // Parse DATABASE_URL to show components (without showing password)
        try {
          const url = new URL(value);
          log(`   Protocol: ${url.protocol}`, 'blue');
          log(`   Host: ${url.hostname}`, 'blue');
          log(`   Port: ${url.port}`, 'blue');
          log(`   Database: ${url.pathname.slice(1)}`, 'blue');
          log(`   Username: ${url.username}`, 'blue');
          log(`   Password: ${'*'.repeat(url.password.length)}`, 'blue');
        } catch (error) {
          log(`   ⚠️  Invalid URL format: ${error.message}`, 'yellow');
          envIssues.push(`${varName}_FORMAT`);
        }
      }
    }
  });
  
  if (envIssues.length > 0) {
    log(`\n❌ Environment issues found: ${envIssues.join(', ')}`, 'red');
  } else {
    log('\n✅ All required environment variables are set', 'green');
  }
  
  // 2. Network Connectivity Test
  logSection('🌐 NETWORK CONNECTIVITY TEST');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('❌ Cannot test network connectivity - DATABASE_URL not set', 'red');
    return false;
  }
  
  try {
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    
    log(`Testing connection to: ${host}:${port}`, 'blue');
    
    // Test with Node.js net module
    const net = require('net');
    
    const testConnection = () => {
      return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeout = 10000; // 10 seconds
        
        socket.setTimeout(timeout);
        
        socket.connect(port, host, () => {
          log('✅ Network connection successful', 'green');
          socket.destroy();
          resolve(true);
        });
        
        socket.on('error', (error) => {
          log(`❌ Network connection failed: ${error.message}`, 'red');
          socket.destroy();
          reject(error);
        });
        
        socket.on('timeout', () => {
          log(`❌ Network connection timeout (${timeout}ms)`, 'red');
          socket.destroy();
          reject(new Error('Connection timeout'));
        });
      });
    };
    
    await testConnection();
    
  } catch (error) {
    log(`❌ Network test failed: ${error.message}`, 'red');
  }
  
  // 3. Prisma Connection Test
  logSection('🗄️ PRISMA DATABASE CONNECTION TEST');
  
  let prisma;
  try {
    prisma = new PrismaClient({
      log: ['error', 'warn', 'info'],
    });
    
    log('Attempting Prisma connection...', 'blue');
    
    // Test basic connection
    await prisma.$connect();
    log('✅ Prisma connection successful', 'green');
    
    // Test query execution
    const result = await prisma.$queryRaw`SELECT version();`;
    log(`✅ Database version: ${JSON.stringify(result)}`, 'green');
    
  } catch (error) {
    log(`❌ Prisma connection failed: ${error.message}`, 'red');
    log(`   Error code: ${error.code}`, 'red');
    log(`   Error details: ${error.meta ? JSON.stringify(error.meta, null, 2) : 'None'}`, 'yellow');
    
    // Analyze common error patterns
    if (error.message.includes('ENOTFOUND')) {
      log('   💡 Suggestion: DNS resolution failed. Check hostname.', 'yellow');
    } else if (error.message.includes('ECONNREFUSED')) {
      log('   💡 Suggestion: Connection refused. Check port and firewall.', 'yellow');
    } else if (error.message.includes('ETIMEDOUT')) {
      log('   💡 Suggestion: Connection timeout. Check network/firewall.', 'yellow');
    } else if (error.message.includes('authentication')) {
      log('   💡 Suggestion: Authentication failed. Check credentials.', 'yellow');
    }
    
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      log('🔐 Prisma connection closed', 'blue');
    }
  }
  
  // 4. Supabase Project Status Check
  logSection('🔍 SUPABASE PROJECT STATUS CHECK');
  
  if (databaseUrl && databaseUrl.includes('supabase.co')) {
    try {
      const url = new URL(databaseUrl);
      const projectRef = url.hostname.split('.')[0].replace('db.', '');
      
      log(`Project reference: ${projectRef}`, 'blue');
      log('Checking Supabase project status...', 'blue');
      
      // We can't directly check Supabase API without API key, 
      // but we can provide guidance
      log('💡 Manual check required:', 'yellow');
      log('   1. Visit https://app.supabase.com/projects', 'yellow');
      log(`   2. Find project: ${projectRef}`, 'yellow');
      log('   3. Check if project status is "Active"', 'yellow');
      log('   4. Verify connection string in Settings > Database', 'yellow');
      
    } catch (error) {
      log(`⚠️  Could not parse Supabase URL: ${error.message}`, 'yellow');
    }
  }
  
  // 5. Alternative Connection Methods
  logSection('🔧 ALTERNATIVE CONNECTION METHODS');
  
  if (databaseUrl) {
    log('Testing direct PostgreSQL connection with node-postgres...', 'blue');
    
    try {
      const { Client } = require('pg');
      
      const client = new Client({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      await client.connect();
      log('✅ node-postgres connection successful', 'green');
      
      const result = await client.query('SELECT version();');
      log(`✅ PostgreSQL version: ${result.rows[0].version}`, 'green');
      
      await client.end();
      log('🔐 node-postgres connection closed', 'blue');
      
    } catch (error) {
      log(`❌ node-postgres connection failed: ${error.message}`, 'red');
    }
  }
  
  // 6. Recommendations
  logSection('💡 RECOMMENDATIONS & NEXT STEPS');
  
  log('Based on the diagnostic results:', 'blue');
  log('');
  
  if (envIssues.length > 0) {
    log('🔴 CRITICAL: Fix environment variable issues first', 'red');
    log('   - Ensure DATABASE_URL is properly formatted', 'yellow');
    log('   - Check .env.local file exists and is readable', 'yellow');
  }
  
  log('🔵 GENERAL RECOMMENDATIONS:', 'blue');
  log('   1. Verify Supabase project is active and not paused', 'yellow');
  log('   2. Check if IP restrictions are enabled in Supabase', 'yellow');
  log('   3. Confirm database credentials are correct', 'yellow');
  log('   4. Try connecting from a different network/environment', 'yellow');
  log('   5. Consider using connection pooling for production', 'yellow');
  
  log('🟡 DEBUGGING STEPS:', 'yellow');
  log('   1. Test connection from different environment (local vs production)', 'yellow');
  log('   2. Try using psql command line tool if available', 'yellow');
  log('   3. Check Supabase dashboard for connection logs', 'yellow');
  log('   4. Verify SSL/TLS requirements', 'yellow');
  
  log('\n📊 Diagnostic completed!', 'cyan');
  return true;
}

// Error handling for missing dependencies
function checkDependencies() {
  const requiredPackages = ['@prisma/client', 'pg'];
  const missingPackages = [];
  
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
    } catch (error) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    log(`❌ Missing required packages: ${missingPackages.join(', ')}`, 'red');
    log('Run: npm install @prisma/client pg', 'yellow');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  try {
    if (!checkDependencies()) {
      process.exit(1);
    }
    
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    await testDatabaseConnection();
    
  } catch (error) {
    log(`\n💥 DIAGNOSTIC TOOL ERROR: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  log(`\n💥 UNHANDLED PROMISE REJECTION: ${error.message}`, 'red');
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { testDatabaseConnection };