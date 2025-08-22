/**
 * Environment Configuration Management
 * Centralizes all environment variables with validation and defaults
 */

import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  
  // AI APIs
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API Key is required'),
  GEMINI_API_KEY: z.string().min(1, 'Gemini API Key is required'),
  
  // Payment
  STRIPE_PUBLIC_KEY: z.string().min(1, 'Stripe Public Key is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe Secret Key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe Webhook Secret is required'),
  
  // Optional services
  REDIS_URL: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  
  // Email
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // App Configuration
  APP_URL: z.string().url('APP_URL must be a valid URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Security
  ENCRYPTION_KEY: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  
  // Analytics & Monitoring
  SENTRY_DSN: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://app.posthog.com'),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().default('100').transform(Number),
  RATE_LIMIT_REQUESTS_PER_HOUR: z.string().default('1000').transform(Number),
})

// Parse and validate environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env)
    return parsed
  } catch (error) {
    console.error('❌ Environment validation failed:')
    
    if (error instanceof z.ZodError) {
      console.error('  - Multiple validation errors found')
      console.error('  - Please check your environment variables')
    }
    
    process.exit(1)
  }
}

// Export validated environment configuration
export const env = validateEnv()

// Configuration objects for different services
export const config = {
  // Database configuration
  database: {
    url: env.DATABASE_URL,
    provider: env.DATABASE_URL.includes('postgresql') ? 'postgresql' : 'sqlite',
  },
  
  // Authentication configuration
  auth: {
    nextAuthUrl: env.NEXTAUTH_URL,
    nextAuthSecret: env.NEXTAUTH_SECRET,
    providers: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      linkedin: {
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
      },
    },
  },
  
  // AI services configuration
  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: 'gpt-4',
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
      model: 'gemini-1.5-flash',
    },
  },
  
  // Payment configuration
  payments: {
    stripe: {
      publicKey: env.STRIPE_PUBLIC_KEY,
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      currency: 'usd',
    },
    plans: {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        tokenLimit: 10000,
        features: ['Basic templates', 'Document export', 'Email support']
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 380, // $3.80 in cents
        tokenLimit: 50000,
        features: ['All templates', 'Priority AI', 'Advanced export', 'Chat support']
      },
      business: {
        id: 'business', 
        name: 'Business',
        price: 980, // $9.80 in cents
        tokenLimit: 200000,
        features: ['Team collaboration', 'Version control', 'API access', 'Phone support']
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 3980, // $39.80 in cents
        tokenLimit: 1000000,
        features: ['Custom templates', 'SSO', 'Dedicated support', 'SLA guarantee']
      },
    },
  },
  
  // Storage configuration
  storage: {
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      bucket: env.AWS_S3_BUCKET,
      region: env.AWS_REGION,
    },
  },
  
  // Email configuration
  email: {
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
    },
    fromEmail: env.FROM_EMAIL || 'noreply@brdprdapp.com',
  },
  
  // App configuration
  app: {
    url: env.APP_URL,
    environment: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
  },
  
  // Security configuration
  security: {
    encryptionKey: env.ENCRYPTION_KEY,
    jwtSecret: env.JWT_SECRET || env.NEXTAUTH_SECRET,
    rateLimits: {
      perMinute: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
      perHour: env.RATE_LIMIT_REQUESTS_PER_HOUR,
    },
  },
  
  // Analytics configuration
  analytics: {
    sentry: {
      dsn: env.SENTRY_DSN,
    },
    posthog: {
      key: env.POSTHOG_KEY,
      host: env.POSTHOG_HOST,
    },
  },
  
  // Redis configuration
  redis: {
    url: env.REDIS_URL,
  },
}

// Export utility functions
export const isProduction = () => config.app.isProduction
export const isDevelopment = () => config.app.isDevelopment

// Export specific configurations for easier imports
export const { auth, ai, payments, storage, email, app, security, analytics } = config

// Validate required services based on environment
if (isProduction()) {
  const requiredServices = [
    { service: 'Stripe', check: payments.stripe.secretKey },
    { service: 'SendGrid', check: email.sendgrid.apiKey },
    { service: 'AWS S3', check: storage.aws.accessKeyId },
  ]
  
  const missingServices = requiredServices.filter(({ check }) => !check)
  
  if (missingServices.length > 0) {
    console.warn('⚠️  Missing optional production services:')
    missingServices.forEach(({ service }) => {
      console.warn(`  - ${service}`)
    })
  }
}

export default config