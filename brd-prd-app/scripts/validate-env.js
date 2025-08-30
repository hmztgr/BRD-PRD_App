#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * Validates that all required environment variables are set
 * and have correct format/values for the current environment.
 */

const path = require('path');
const fs = require('fs');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
};

// Define required environment variables by category
const envConfig = {
  required: {
    // Core database and auth
    DATABASE_URL: { 
      description: 'Database connection string',
      validate: (val) => val.includes('postgresql') || val.includes('sqlite') || val.includes('file:')
    },
    NEXTAUTH_URL: {
      description: 'NextAuth base URL',
      validate: (val) => val.startsWith('http://') || val.startsWith('https://')
    },
    NEXTAUTH_SECRET: {
      description: 'NextAuth secret key',
      validate: (val) => val.length >= 32
    },
    
    // OAuth providers
    GOOGLE_CLIENT_ID: {
      description: 'Google OAuth Client ID',
      validate: (val) => val.length > 10
    },
    GOOGLE_CLIENT_SECRET: {
      description: 'Google OAuth Client Secret',
      validate: (val) => val.length > 10
    },
    
    // AI APIs
    OPENAI_API_KEY: {
      description: 'OpenAI API Key',
      validate: (val) => val.startsWith('sk-')
    },
    GEMINI_API_KEY: {
      description: 'Google Gemini API Key',
      validate: (val) => val.length > 10
    },
    
    // App configuration
    APP_URL: {
      description: 'Application base URL',
      validate: (val) => val.startsWith('http://') || val.startsWith('https://')
    }
  },
  
  production: {
    // Payment processing (required in production)
    STRIPE_PUBLIC_KEY: {
      description: 'Stripe publishable key',
      validate: (val) => val.startsWith('pk_')
    },
    STRIPE_SECRET_KEY: {
      description: 'Stripe secret key',
      validate: (val) => val.startsWith('sk_')
    },
    STRIPE_WEBHOOK_SECRET: {
      description: 'Stripe webhook secret',
      validate: (val) => val.startsWith('whsec_')
    }
  },
  
  optional: {
    // Optional services
    LINKEDIN_CLIENT_ID: {
      description: 'LinkedIn OAuth Client ID'
    },
    LINKEDIN_CLIENT_SECRET: {
      description: 'LinkedIn OAuth Client Secret'
    },
    REDIS_URL: {
      description: 'Redis connection URL for caching',
      validate: (val) => val.startsWith('redis://')
    },
    AWS_ACCESS_KEY_ID: {
      description: 'AWS Access Key for S3 storage'
    },
    AWS_SECRET_ACCESS_KEY: {
      description: 'AWS Secret Key for S3 storage'
    },
    AWS_S3_BUCKET: {
      description: 'AWS S3 bucket name'
    },
    SENDGRID_API_KEY: {
      description: 'SendGrid API key for emails',
      validate: (val) => val.startsWith('SG.')
    },
    FROM_EMAIL: {
      description: 'From email address',
      validate: (val) => val.includes('@')
    },
    SENTRY_DSN: {
      description: 'Sentry DSN for error tracking',
      validate: (val) => val.startsWith('https://')
    },
    POSTHOG_KEY: {
      description: 'PostHog API key for analytics'
    }
  }
};

// Load environment variables
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      envVars[key.trim()] = value;
    }
  });
  
  return envVars;
}

function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  logSection(`Environment Validation (${process.env.NODE_ENV || 'development'})`);
  
  let errors = [];
  let warnings = [];
  let success = [];
  
  // Load environment files
  const envFiles = ['.env.local', '.env', '.env.example'];
  let envVars = { ...process.env };
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const fileVars = loadEnvFile(filePath);
      envVars = { ...envVars, ...fileVars };
      log('blue', `✓ Loaded ${file}`);
    }
  });
  
  // Validate required variables
  Object.entries(envConfig.required).forEach(([key, config]) => {
    const value = envVars[key];
    
    if (!value) {
      errors.push(`❌ Missing required variable: ${key} - ${config.description}`);
    } else if (config.validate && !config.validate(value)) {
      errors.push(`❌ Invalid format for ${key}: ${config.description}`);
    } else {
      success.push(`✓ ${key}`);
    }
  });
  
  // Validate production-required variables
  if (isProduction) {
    Object.entries(envConfig.production).forEach(([key, config]) => {
      const value = envVars[key];
      
      if (!value) {
        errors.push(`❌ Missing production variable: ${key} - ${config.description}`);
      } else if (config.validate && !config.validate(value)) {
        errors.push(`❌ Invalid format for ${key}: ${config.description}`);
      } else {
        success.push(`✓ ${key} (production)`);
      }
    });
  }
  
  // Check optional variables
  Object.entries(envConfig.optional).forEach(([key, config]) => {
    const value = envVars[key];
    
    if (!value) {
      if (isProduction) {
        warnings.push(`⚠️  Optional variable not set: ${key} - ${config.description}`);
      }
    } else if (config.validate && !config.validate(value)) {
      warnings.push(`⚠️  Invalid format for optional ${key}: ${config.description}`);
    } else {
      success.push(`✓ ${key} (optional)`);
    }
  });
  
  // Display results
  if (success.length > 0) {
    logSection('Configured Variables');
    success.forEach(msg => log('green', msg));
  }
  
  if (warnings.length > 0) {
    logSection('Warnings');
    warnings.forEach(msg => log('yellow', msg));
  }
  
  if (errors.length > 0) {
    logSection('Errors');
    errors.forEach(msg => log('red', msg));
    
    console.log(`\n${colors.red}${colors.bold}Environment validation failed with ${errors.length} errors.${colors.reset}`);
    console.log(`${colors.yellow}Please check your .env.local file and fix the issues above.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ Environment validation passed!${colors.reset}`);
    console.log(`${colors.green}All required variables are properly configured.${colors.reset}`);
    
    if (warnings.length > 0) {
      console.log(`${colors.yellow}Note: ${warnings.length} optional services are not configured.${colors.reset}`);
    }
  }
}

// Environment-specific recommendations
function showRecommendations() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  logSection('Recommendations');
  
  if (isDevelopment) {
    console.log(`${colors.blue}Development Environment:${colors.reset}`);
    console.log('• Use SQLite for local database (file:./dev.db)');
    console.log('• Use Stripe test keys (pk_test_*, sk_test_*)');
    console.log('• Set MOCK_PAYMENTS=true for testing');
    console.log('• Use localhost URLs for OAuth redirects');
  }
  
  if (isProduction) {
    console.log(`${colors.blue}Production Environment:${colors.reset}`);
    console.log('• Use PostgreSQL database (Railway)');
    console.log('• Use Stripe live keys (pk_live_*, sk_live_*)');
    console.log('• Configure all optional services for full functionality');
    console.log('• Set up monitoring with Sentry and PostHog');
    console.log('• Enable Redis for session caching');
  }
}

// Security checks
function performSecurityChecks() {
  logSection('Security Checks');
  
  const securityChecks = [
    {
      check: () => process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
      message: 'NextAuth secret is sufficiently long (32+ characters)',
      warning: 'NextAuth secret should be at least 32 characters'
    },
    {
      check: () => !process.env.NEXTAUTH_SECRET || !process.env.NEXTAUTH_SECRET.includes('your-'),
      message: 'NextAuth secret appears to be customized',
      warning: 'NextAuth secret appears to be using default/example value'
    },
    {
      check: () => process.env.NODE_ENV !== 'production' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')),
      message: 'Production is using PostgreSQL database',
      warning: 'Production should use PostgreSQL, not SQLite'
    },
    {
      check: () => process.env.NODE_ENV !== 'production' || (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('sk_live')),
      message: 'Production is using Stripe live keys',
      warning: 'Production should use Stripe live keys, not test keys'
    }
  ];
  
  securityChecks.forEach(({ check, message, warning }) => {
    if (check()) {
      log('green', `✓ ${message}`);
    } else {
      log('yellow', `⚠️  ${warning}`);
    }
  });
}

// Main execution
if (require.main === module) {
  try {
    validateEnvironment();
    performSecurityChecks();
    showRecommendations();
  } catch (error) {
    log('red', `Environment validation failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateEnvironment };