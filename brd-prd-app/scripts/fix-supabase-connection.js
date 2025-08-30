#!/usr/bin/env node

/**
 * Supabase Connection Fix Tool
 * Addresses IPv6 connectivity issues and provides alternative solutions
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
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

async function createFixedDatabaseUrl() {
  logSection('🔧 SUPABASE CONNECTION FIX TOOL');
  
  const originalDatabaseUrl = process.env.DATABASE_URL;
  if (!originalDatabaseUrl) {
    log('❌ DATABASE_URL not found in environment variables', 'red');
    return false;
  }
  
  log(`Original DATABASE_URL: ${originalDatabaseUrl.replace(/:[^:@]*@/, ':****@')}`, 'blue');
  
  // Solution 1: Force IPv4 by using IP address instead of hostname
  logSection('🌐 SOLUTION 1: IPv4 CONNECTION');
  
  try {
    const dns = require('dns').promises;
    const url = new URL(originalDatabaseUrl);
    
    log('Resolving hostname to IPv4 address...', 'blue');
    
    // Try to resolve IPv4 address
    try {
      const addresses = await dns.resolve4(url.hostname);
      if (addresses && addresses.length > 0) {
        const ipv4Address = addresses[0];
        log(`✅ Found IPv4 address: ${ipv4Address}`, 'green');
        
        // Create new DATABASE_URL with IPv4 address
        const fixedUrl = originalDatabaseUrl.replace(url.hostname, ipv4Address);
        
        log('Creating .env.local.fixed with IPv4 connection...', 'blue');
        
        // Read current .env.local
        const envLocalPath = path.join(process.cwd(), '.env.local');
        let envContent = '';
        
        if (fs.existsSync(envLocalPath)) {
          envContent = fs.readFileSync(envLocalPath, 'utf8');
        }
        
        // Replace DATABASE_URL with IPv4 version
        const updatedContent = envContent.replace(
          /DATABASE_URL=.*/,
          `DATABASE_URL="${fixedUrl}"`
        );
        
        // Write to .env.local.fixed
        const fixedEnvPath = path.join(process.cwd(), '.env.local.fixed');
        fs.writeFileSync(fixedEnvPath, updatedContent);
        
        log(`✅ Created ${fixedEnvPath} with IPv4 connection`, 'green');
        log('To use this fix:', 'yellow');
        log('  1. Backup your current .env.local: cp .env.local .env.local.backup', 'yellow');
        log('  2. Use the fixed version: cp .env.local.fixed .env.local', 'yellow');
        log('  3. Test the connection again', 'yellow');
        
        return { ipv4: ipv4Address, fixedUrl };
      }
    } catch (dnsError) {
      log(`❌ IPv4 resolution failed: ${dnsError.message}`, 'red');
    }
    
  } catch (error) {
    log(`❌ IPv4 fix failed: ${error.message}`, 'red');
  }
  
  // Solution 2: Alternative Supabase connection strings
  logSection('🔄 SOLUTION 2: ALTERNATIVE CONNECTION METHODS');
  
  log('Supabase provides multiple connection methods:', 'blue');
  log('1. Direct connection (current method)', 'yellow');
  log('2. Connection pooling with PgBouncer', 'yellow');
  log('3. Connection via Supabase client libraries', 'yellow');
  
  const url = new URL(originalDatabaseUrl);
  const poolerUrl = originalDatabaseUrl.replace(
    `${url.hostname}:5432`,
    `${url.hostname}:6543`
  );
  
  log(`\nTry PgBouncer pooler (port 6543):`, 'green');
  log(`${poolerUrl.replace(/:[^:@]*@/, ':****@')}`, 'blue');
  
  // Create alternative .env file
  const envLocalPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  }
  
  const poolerContent = envContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL="${poolerUrl}"`
  );
  
  const poolerEnvPath = path.join(process.cwd(), '.env.local.pooler');
  fs.writeFileSync(poolerEnvPath, poolerContent);
  log(`✅ Created ${poolerEnvPath} with PgBouncer pooler`, 'green');
  
  // Solution 3: Local development with SQLite
  logSection('💾 SOLUTION 3: LOCAL SQLITE FALLBACK');
  
  log('For development, consider using SQLite locally:', 'blue');
  
  const sqliteContent = envContent.replace(
    /DATABASE_URL=.*/,
    'DATABASE_URL="file:./dev.db"'
  );
  
  const sqliteEnvPath = path.join(process.cwd(), '.env.local.sqlite');
  fs.writeFileSync(sqliteEnvPath, sqliteContent);
  log(`✅ Created ${sqliteEnvPath} with SQLite database`, 'green');
  
  log('To use SQLite for development:', 'yellow');
  log('  1. Copy the SQLite env: cp .env.local.sqlite .env.local', 'yellow');
  log('  2. Run prisma migrate: npx prisma db push', 'yellow');
  log('  3. Use for local development only', 'yellow');
  
  return true;
}

async function testAlternativeConnections() {
  logSection('🧪 TESTING ALTERNATIVE CONNECTIONS');
  
  const testFiles = [
    { file: '.env.local.fixed', description: 'IPv4 connection' },
    { file: '.env.local.pooler', description: 'PgBouncer pooler' },
    { file: '.env.local.sqlite', description: 'SQLite fallback' }
  ];
  
  for (const testFile of testFiles) {
    const filePath = path.join(process.cwd(), testFile.file);
    if (fs.existsSync(filePath)) {
      log(`\n🔍 Testing ${testFile.description}...`, 'blue');
      
      try {
        // Load environment from test file
        const envContent = fs.readFileSync(filePath, 'utf8');
        const databaseUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
        
        if (databaseUrlMatch) {
          const testDatabaseUrl = databaseUrlMatch[1];
          log(`URL: ${testDatabaseUrl.replace(/:[^:@]*@/, ':****@')}`, 'blue');
          
          if (testDatabaseUrl.startsWith('file:')) {
            log('✅ SQLite connection (local file)', 'green');
          } else {
            // Test network connection for PostgreSQL
            const { Client } = require('pg');
            const client = new Client({
              connectionString: testDatabaseUrl,
              ssl: { rejectUnauthorized: false },
              connectionTimeoutMillis: 10000,
            });
            
            try {
              await client.connect();
              log('✅ Connection successful!', 'green');
              
              const result = await client.query('SELECT version();');
              log(`✅ Database version check passed`, 'green');
              
              await client.end();
            } catch (error) {
              log(`❌ Connection failed: ${error.message}`, 'red');
            }
          }
        }
      } catch (error) {
        log(`❌ Test failed: ${error.message}`, 'red');
      }
    }
  }
}

async function createConnectionGuide() {
  logSection('📋 CREATING CONNECTION TROUBLESHOOTING GUIDE');
  
  const guide = `# Supabase Database Connection Troubleshooting Guide

## Issue Identified
- **Problem**: IPv6 connectivity issue with Supabase PostgreSQL
- **Error**: \`connect ENETUNREACH\` with IPv6 address
- **Root Cause**: System attempting IPv6 connection when IPv4 is required

## Solutions Available

### 1. IPv4 Force Connection (Recommended)
\`\`\`bash
# Use the auto-generated IPv4 connection
cp .env.local.fixed .env.local
npm run dev
\`\`\`

### 2. PgBouncer Connection Pooler
\`\`\`bash
# Use connection pooling (more stable for production)
cp .env.local.pooler .env.local
npm run dev
\`\`\`

### 3. Local SQLite Development
\`\`\`bash
# For local development only
cp .env.local.sqlite .env.local
npx prisma db push
npm run dev
\`\`\`

## Manual Supabase Checks

### Check Project Status
1. Visit [Supabase Dashboard](https://app.supabase.com/projects)
2. Verify project is **Active** (not paused)
3. Check for any billing issues
4. Verify connection limits haven't been exceeded

### Connection Settings
1. Go to Settings > Database in Supabase
2. Check connection string format
3. Verify IP restrictions (should allow your IP)
4. Consider enabling connection pooling

### Network Debugging
\`\`\`bash
# Test different connection methods
node scripts/db-connection-diagnostic.js

# Test with curl (if available)
curl -v telnet://db.nutehrmyxqyzhfppsknk.supabase.co:5432

# Check DNS resolution
nslookup db.nutehrmyxqyzhfppsknk.supabase.co
\`\`\`

## Environment Files Created

- \`.env.local.fixed\` - IPv4 connection
- \`.env.local.pooler\` - PgBouncer connection  
- \`.env.local.sqlite\` - Local SQLite fallback
- \`.env.local.backup\` - Original backup

## Next Steps

1. **Try IPv4 connection first** (most likely to work)
2. **If still failing**, check Supabase dashboard
3. **For development**, use SQLite locally
4. **For production**, ensure proper SSL and connection pooling

## Common Error Patterns

- \`ENETUNREACH\` → IPv6/IPv4 issue (use IPv4 fix)
- \`ECONNREFUSED\` → Port/firewall issue
- \`ETIMEDOUT\` → Network timeout (try pooler)
- \`authentication failed\` → Wrong credentials
- \`too many connections\` → Use connection pooling

## Production Recommendations

- Use connection pooling (PgBouncer)
- Enable SSL certificate validation
- Set appropriate connection limits
- Monitor connection usage
- Use environment-specific connection strings
`;

  const guidePath = path.join(process.cwd(), 'docs/SUPABASE_CONNECTION_GUIDE.md');
  
  // Ensure docs directory exists
  const docsDir = path.dirname(guidePath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(guidePath, guide);
  log(`✅ Created troubleshooting guide: ${guidePath}`, 'green');
  
  return guidePath;
}

async function main() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    await createFixedDatabaseUrl();
    await testAlternativeConnections();
    await createConnectionGuide();
    
    logSection('🎉 CONNECTION FIX COMPLETED');
    
    log('Next steps:', 'blue');
    log('1. Try the IPv4 connection: cp .env.local.fixed .env.local', 'yellow');
    log('2. Test the connection: npm run dev', 'yellow');
    log('3. If issues persist, check Supabase dashboard', 'yellow');
    log('4. For development, consider SQLite: cp .env.local.sqlite .env.local', 'yellow');
    
  } catch (error) {
    log(`\n💥 FIX TOOL ERROR: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createFixedDatabaseUrl, testAlternativeConnections };