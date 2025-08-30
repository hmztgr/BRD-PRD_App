#!/usr/bin/env node

/**
 * Production Deployment Script
 * 
 * This script handles the deployment process for production:
 * 1. Switches to production Prisma schema
 * 2. Runs database migrations
 * 3. Builds the application
 * 4. Runs production setup tasks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const log = (message) => {
  console.log(`[DEPLOY] ${message}`);
};

const error = (message) => {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
};

async function deployProduction() {
  log('Starting production deployment...');
  
  try {
    // Step 1: Backup current schema and switch to production
    log('Switching to production database schema...');
    
    const currentSchema = path.join(__dirname, '../prisma/schema.prisma');
    const productionSchema = path.join(__dirname, '../prisma/schema.production.prisma');
    const backupSchema = path.join(__dirname, '../prisma/schema.dev.backup.prisma');
    
    // Backup development schema
    if (fs.existsSync(currentSchema)) {
      fs.copyFileSync(currentSchema, backupSchema);
      log('Development schema backed up');
    }
    
    // Copy production schema to main schema file
    if (fs.existsSync(productionSchema)) {
      fs.copyFileSync(productionSchema, currentSchema);
      log('Production schema activated');
    } else {
      error('Production schema file not found');
    }
    
    // Step 2: Validate environment variables
    log('Validating production environment variables...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    log('Environment variables validated');
    
    // Step 3: Generate Prisma client
    log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Step 4: Run database migrations (only if DATABASE_URL is PostgreSQL)
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
      log('Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      log('Database migrations completed');
      
      // Step 5: Seed production data if needed
      log('Checking for seed data...');
      const seedFile = path.join(__dirname, 'seed-production.js');
      if (fs.existsSync(seedFile)) {
        log('Running production seed...');
        execSync('node scripts/seed-production.js', { stdio: 'inherit' });
      }
    } else {
      log('Skipping migrations (not PostgreSQL database)');
    }
    
    // Step 6: Build application
    log('Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 7: Run production checks
    log('Running production health checks...');
    
    // Check if build directory exists
    const buildDir = path.join(__dirname, '../.next');
    if (!fs.existsSync(buildDir)) {
      error('Build directory not found - build may have failed');
    }
    
    log('✅ Production deployment completed successfully!');
    log('');
    log('Next steps:');
    log('1. Deploy to Vercel: vercel --prod');
    log('2. Configure environment variables in Vercel dashboard');
    log('3. Test the deployed application');
    log('4. Monitor logs and performance');
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

// Handle cleanup on process exit
process.on('exit', () => {
  // Restore development schema if deployment fails
  const currentSchema = path.join(__dirname, '../prisma/schema.prisma');
  const backupSchema = path.join(__dirname, '../prisma/schema.dev.backup.prisma');
  
  if (fs.existsSync(backupSchema) && process.exitCode !== 0) {
    fs.copyFileSync(backupSchema, currentSchema);
    log('Development schema restored due to deployment failure');
  }
});

if (require.main === module) {
  deployProduction();
}

module.exports = { deployProduction };