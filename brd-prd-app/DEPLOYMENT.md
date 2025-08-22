# 🚀 Production Deployment Guide

## Overview
This guide covers deploying the BRD-PRD App to production using Vercel (frontend/API) and Railway (database/backend services).

## Prerequisites
- GitHub repository with your code
- Vercel account (free tier available)
- Railway account (free $5 credit monthly)
- Stripe account for payments
- Google Cloud Console for OAuth
- OpenAI/Gemini API keys

## 1. Database Setup (Railway)

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Provision PostgreSQL"
3. Note down the database connection details

### Step 2: Configure Database
```bash
# Connect to Railway PostgreSQL
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Step 3: Run Migrations
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and connect
railway login
railway link

# Run database migrations
npx prisma migrate deploy
npx prisma generate
```

## 2. Vercel Deployment

### Step 1: Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project" → Import from GitHub
3. Select your BRD-PRD App repository
4. Configure build settings (auto-detected for Next.js)

### Step 2: Environment Variables
Add the following environment variables in Vercel dashboard:

#### Required Environment Variables
```bash
# Database
DATABASE_URL="your-railway-postgresql-url"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-32-character-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI APIs
OPENAI_API_KEY="your-openai-api-key"
GEMINI_API_KEY="your-gemini-api-key"

# Stripe (use test keys initially)
STRIPE_PUBLIC_KEY="pk_test_your-key"
STRIPE_SECRET_KEY="sk_test_your-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### Step 3: Deploy
1. Click "Deploy" in Vercel
2. Wait for build completion (~2-3 minutes)
3. Test the deployed application

## 3. OAuth Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

### LinkedIn OAuth Setup (Optional)
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com)
2. Create new application
3. Add redirect URL: `https://your-app.vercel.app/api/auth/callback/linkedin`

## 4. Payment Setup (Stripe)

### Development Mode
1. Use Stripe test keys initially
2. Create webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Configure webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### Production Mode
1. Activate Stripe account
2. Replace with live keys
3. Update webhook endpoint to production URL

## 5. File Storage (AWS S3)

### Setup S3 Bucket
```bash
# AWS CLI commands
aws s3 mb s3://your-bucket-name
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors.json
```

### CORS Configuration (cors.json)
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-app.vercel.app"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## 6. Monitoring & Analytics

### Error Monitoring (Sentry)
1. Create [Sentry](https://sentry.io) account
2. Add Sentry DSN to environment variables
3. Configure error tracking in Next.js

### User Analytics (PostHog)
1. Create [PostHog](https://posthog.com) account
2. Add PostHog key to environment variables
3. Configure user event tracking

## 7. Custom Domain (Optional)

### Step 1: Domain Configuration
1. Purchase domain from your preferred registrar
2. Go to Vercel project settings → Domains
3. Add your custom domain

### Step 2: DNS Configuration
Add these DNS records at your domain registrar:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

### Step 3: SSL Certificate
- Vercel automatically provisions SSL certificates
- Wait for DNS propagation (up to 48 hours)

## 8. Testing Production Deployment

### Functionality Checklist
- [ ] User registration and login
- [ ] Google OAuth authentication
- [ ] Document generation (English/Arabic)
- [ ] Document export (PDF/DOCX)
- [ ] Payment processing (Stripe)
- [ ] Email notifications
- [ ] File upload functionality
- [ ] Mobile responsiveness

### Performance Testing
```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://your-app.vercel.app --output html

# Load testing with Artillery
npm install -g artillery
artillery quick --count 10 --num 3 https://your-app.vercel.app
```

## 9. Security Considerations

### Environment Security
- Never commit .env files to version control
- Use Vercel environment variables for all secrets
- Rotate API keys regularly

### Content Security Policy
- Configured in `vercel.json`
- Restricts script/style/image sources
- Prevents XSS attacks

### Rate Limiting
- Implemented in API routes
- Prevents API abuse
- Configurable per endpoint

## 10. Backup & Recovery

### Database Backups
```bash
# Railway automatic backups (available in dashboard)
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Code Backups
- GitHub serves as primary code backup
- Vercel maintains deployment history
- Configure automated GitHub backups

## 11. Scaling Considerations

### Vercel Scaling
- Automatic scaling included in free tier
- Upgrade to Pro for higher limits
- Edge functions for global performance

### Database Scaling
- Railway handles connection pooling
- Upgrade to higher tier for more resources
- Consider read replicas for heavy traffic

## 12. Monitoring & Maintenance

### Health Checks
Create monitoring endpoints:
```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    ai: 'operational'
  });
}
```

### Log Monitoring
- Vercel provides function logs
- Set up log aggregation with external service
- Monitor error rates and response times

## 13. Launch Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database migrations deployed
- [ ] OAuth providers configured
- [ ] Payment system tested
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Backup systems tested

### Launch Day
- [ ] Deploy to production
- [ ] Verify all functionality
- [ ] Test payment flows
- [ ] Monitor error rates
- [ ] Update DNS if needed
- [ ] Announce to users

### Post-Launch
- [ ] Monitor performance metrics
- [ ] Track user registration/usage
- [ ] Review error logs
- [ ] Plan feature updates
- [ ] Collect user feedback

## Support & Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL format
2. **OAuth Errors**: Verify redirect URIs match exactly
3. **Build Failures**: Check Node.js version compatibility
4. **API Timeouts**: Increase function timeout in vercel.json

### Getting Help
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)

## Cost Optimization

### Vercel (Free Tier Limits)
- 100GB bandwidth/month
- 100GB-hrs serverless functions
- 1000 edge function invocations

### Railway (Free Tier)
- $5 credit/month
- Typically covers small-medium databases
- Monitor usage in dashboard

### Monitoring Costs
- Set up billing alerts in both platforms
- Monitor resource usage regularly
- Optimize code for efficiency