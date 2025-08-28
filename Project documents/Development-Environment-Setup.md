# Development Environment Setup Guide

This document outlines the complete process for setting up a separate development environment for the BRD-PRD App, ensuring complete isolation from the production environment.

## Overview

The development environment setup involves creating separate instances of key services while reusing shared services where appropriate. This approach provides:
- Complete database isolation between development and production
- Safe testing environment for new features
- Ability to test deployments without affecting production users
- Cost-effective resource sharing for non-critical services

## Environment Strategy

### Separate Services (Required)
- **Supabase Project**: New project for development database and auth
- **Vercel Project**: New project for development deployments

### Shared Services (Safe to Reuse)
- **OAuth Apps**: Add development URLs to existing Google/LinkedIn apps
- **Mailjet Email**: Use same account with development email prefixes
- **Stripe**: Use existing test keys (already isolated from production)
- **Redis**: Use same local instance (development only)

---

## 1. Supabase Development Project Setup

### Step 1: Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Choose your organization
4. Set project name: `brd-prd-app-development`
5. Set database password (save this securely)
6. Choose region (same as production for consistency)
7. Click "Create new project"

### Step 2: Database Schema Setup
You have two options:

#### Option A: Copy Schema from Production
1. In production Supabase project, go to Settings → Database
2. Download database dump or use SQL Editor to export schema
3. In development project, import the schema using SQL Editor

#### Option B: Use Prisma Migrations (Recommended)
1. Update `.env.local` with development database URL
2. Run `npm run db:push` to sync Prisma schema
3. Run any seed scripts if available

### Step 3: Configure Authentication
1. In development Supabase project → Authentication → Settings
2. Set Site URL: `http://localhost:3002`
3. Add Additional Redirect URLs:
   - `http://localhost:3002/api/auth/callback`
   - Your development Vercel URL when created
4. Configure email templates if needed

### Step 4: Update CORS Settings
1. Go to Settings → API
2. Add CORS origins:
   - `http://localhost:3002`
   - Your development Vercel URL when created

---

## 2. Environment Variable Configuration

### Development Environment Variables (.env.local)
Update your `.env.local` file with development-specific values:

```env
# Database - Development Supabase Project
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
Transaction_pooler_Shared_Pooler="postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
Session_pooler="postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

# NextAuth - Development
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="wvuF3azUrJPUSkUyK+IvBbjCUjnfUg0evsAinMk3gZU="

# OAuth Providers - Same apps, just add development URLs
GOOGLE_CLIENT_ID="1027046962675-0gt0obf0fek0ktm9pnt7t2uie9f0dap8.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
LINKEDIN_CLIENT_ID="78wfx4wcuz32pg"
LINKEDIN_CLIENT_SECRET="WPL_AP1.QtvEe2UUaS2uKOQD.FPwPjw=="

# AI APIs - Same keys (no environment separation needed)
OPENAI_API_KEY="your_openai_api_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"

# Payment - Keep test keys for development
STRIPE_PUBLIC_KEY="your_stripe_public_key_here"
STRIPE_SECRET_KEY="your_stripe_secret_key_here"
STRIPE_WEBHOOK_SECRET="whsec_SCCfr1qlQnTqhkzshVdUVYKn7H4ugXKQ"

# Redis - Same local instance
REDIS_URL="redis://localhost:6379"

# Email - Same Mailjet account with dev prefix
MAILJET_API_KEY="92307ce63e06f0dbf7e2cd31c1ff9735"
MAILJET_SECRET_KEY="afffb769044341de7481f63252d0941d"
FROM_EMAIL="hmztgr@gmail.com"

# App Configuration
NODE_ENV="development"
```

### Production Environment Variables (.env.production)
Create this file for production deployment values (keep your current production database URL here).

---

## 3. OAuth Provider Configuration

### Google OAuth Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing OAuth project
3. Navigate to APIs & Services → Credentials
4. Edit your existing OAuth 2.0 client
5. **Add to Authorized Redirect URIs**:
   - `http://localhost:3002/api/auth/callback/google`
   - `https://your-dev-vercel-url.vercel.app/api/auth/callback/google`
6. Save changes

### LinkedIn Developer Console
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Select your existing app
3. Go to Auth tab
4. **Add to Authorized Redirect URLs**:
   - `http://localhost:3002/api/auth/callback/linkedin`
   - `https://your-dev-vercel-url.vercel.app/api/auth/callback/linkedin`
5. Save changes

---

## 4. Stripe Development Configuration

### Test Environment Usage
- Your current test keys are already isolated from production
- Create development-specific products in **Stripe Test Dashboard**:
  1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
  2. Ensure you're in **Test mode** (toggle in left sidebar)
  3. Create new products with names like:
     - `BRD-PRD App (Development) - Basic Plan`
     - `BRD-PRD App (Development) - Pro Plan`
  4. Set different price IDs for development

### Webhook Configuration
1. In Stripe Test Dashboard → Webhooks
2. Create new endpoint for development:
   - URL: `https://your-dev-vercel-url.vercel.app/api/webhooks/stripe`
   - Events: Same as production
3. Update `STRIPE_WEBHOOK_SECRET` in development environment

---

## 5. Vercel Development Project Setup

### Step 1: Create New Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import the same GitHub repository
4. **Important**: Set different settings:
   - Project name: `brd-prd-app-development`
   - Branch: `development` (or create a `dev` branch)
   - Root directory: `brd-prd-app`

### Step 2: Configure Environment Variables
In Vercel project settings → Environment Variables, add:
```
DATABASE_URL=your-development-supabase-url
NEXTAUTH_URL=https://your-dev-vercel-url.vercel.app
# ... all other environment variables for development
```

### Step 3: Deployment Configuration
- Set up automatic deployments from `development` branch
- Configure preview deployments for feature branches
- Set different custom domain if desired

---

## 6. Development Workflow

### Local Development
```bash
# Start local development
npm run dev

# Access at http://localhost:3002
```

### Testing Deployments
1. Push to `development` branch
2. Vercel automatically deploys to development project
3. Test at your development Vercel URL

### Environment Switching
- **Local Development**: Uses `.env.local` (development database)
- **Development Deployment**: Uses Vercel environment variables (development database)
- **Production Deployment**: Uses production Vercel project (production database)

---

## 7. Security Considerations

### Environment Isolation
- Development and production databases are completely separate
- No risk of development code affecting production data
- Test Stripe keys cannot process real payments

### API Key Management
- Use same AI API keys (OpenAI, Gemini) - they track usage separately
- Use same email service keys - emails are clearly identified
- OAuth keys work across environments with proper redirect URI configuration

---

## 8. Migration Process

### From Current Setup to Development Environment
1. **Backup current `.env.local`** (it has production database URLs)
2. **Create development Supabase project** following Step 1
3. **Update `.env.local`** with development database URLs
4. **Test local development** to ensure everything works
5. **Create Vercel development project** when ready to test deployments

### Rollback Plan
If issues arise, restore the backed-up `.env.local` file to return to current setup.

---

## 9. Benefits of This Setup

### Development Benefits
- Safe feature development without production impact
- Ability to test database migrations
- Freedom to experiment with data and configurations
- Parallel development team workflows

### Cost Efficiency
- Only Supabase and Vercel require separate projects
- Shared OAuth apps, email service, and test Stripe environment
- No additional API key costs for AI services

### Maintenance
- Single codebase with environment-specific configurations
- Clear separation between development and production
- Easy switching between environments

---

## 10. Next Steps

1. Create Supabase development project
2. Update local `.env.local` file with development database URLs
3. Test local development environment
4. Create Vercel development project when ready for deployment testing
5. Update OAuth providers with development redirect URLs
6. Create development-specific Stripe products for testing

---

## Troubleshooting

### Common Issues
- **OAuth redirect mismatch**: Ensure all development URLs are added to OAuth app configurations
- **Database connection errors**: Verify development Supabase URL and credentials
- **Stripe webhook failures**: Update webhook URL in Stripe dashboard for development environment

### Support Resources
- Supabase Documentation: https://supabase.com/docs
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs