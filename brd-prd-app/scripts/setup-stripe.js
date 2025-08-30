#!/usr/bin/env node

/**
 * Script to setup Stripe products and prices
 * Run this once after configuring your Stripe keys
 */

require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    console.log('🚀 Setting up Stripe products and prices...');
    console.log('Environment check:');
    console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ Set' : '❌ Missing');
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is required in .env.local');
      process.exit(1);
    }

    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.error('❌ Invalid STRIPE_SECRET_KEY format (should start with sk_)');
      process.exit(1);
    }

    // Import after environment check
    const { setupStripeProducts } = require('../src/lib/stripe');
    
    await setupStripeProducts();
    
    console.log('✅ Stripe setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up webhook endpoints in Stripe dashboard');
    console.log('2. Test payment flows');
    console.log('3. Update webhook secret in .env.local');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();