# 🚂 Railway Deployment Guide

## Overview
This guide covers setting up Railway for PostgreSQL database hosting and optional backend services.

## Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub repository with your code
- Local Railway CLI (optional but recommended)

## 1. Database Setup

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project"
3. Select "Provision PostgreSQL" from the templates
4. Name your project (e.g., "BRD-PRD-App-Production")

### Step 2: Get Database Connection Details
1. Click on your PostgreSQL service
2. Go to "Connect" tab
3. Copy the "Postgres Connection URL"
4. It will look like: `postgresql://postgres:password@host:port/railway`

### Step 3: Configure Database for Production
```bash
# The connection URL format
DATABASE_URL="postgresql://postgres:password@host:port/railway"

# Example (don't use this exact one):
DATABASE_URL="postgresql://postgres:abc123@containers-us-west-1.railway.app:6543/railway"
```

## 2. Railway CLI Setup (Optional but Recommended)

### Install Railway CLI
```bash
# npm
npm install -g @railway/cli

# Or using curl
curl -fsSL https://railway.app/install.sh | sh
```

### Login and Link Project
```bash
# Login to Railway
railway login

# Navigate to your project directory
cd /path/to/brd-prd-app

# Link to your Railway project
railway link

# Check connection
railway status
```

## 3. Environment Variables in Railway

### Method 1: Railway Dashboard
1. Go to your project in Railway dashboard
2. Click "Variables" in the sidebar
3. Add the following variables:

```bash
# Database (auto-generated)
DATABASE_URL=postgresql://postgres:password@host:port/railway

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-32-character-secret

# Google OAuth (production credentials)
GOOGLE_CLIENT_ID=your-google-prod-client-id
GOOGLE_CLIENT_SECRET=your-google-prod-client-secret

# AI APIs
OPENAI_API_KEY=sk-proj-your-production-key
GEMINI_API_KEY=your-production-gemini-key

# Stripe (production keys)
STRIPE_PUBLIC_KEY=pk_live_your-key
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Optional: Redis (if using Railway Redis)
REDIS_URL=redis://default:password@host:port

# App Configuration
NODE_ENV=production
APP_URL=https://your-app.vercel.app
```

### Method 2: Railway CLI
```bash
# Set environment variables via CLI
railway variables set DATABASE_URL="your-database-url"
railway variables set NEXTAUTH_SECRET="your-secret"
railway variables set GOOGLE_CLIENT_ID="your-client-id"
# ... add other variables

# View all variables
railway variables list
```

## 4. Database Migration

### Using Railway CLI
```bash
# Generate Prisma client
railway run npx prisma generate

# Run migrations
railway run npx prisma migrate deploy

# Seed production data
railway run npm run seed:production
```

### Using Local Connection
```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="your-railway-postgres-url"

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Seed data
npm run seed:production
```

## 5. Railway Configuration Files

### railway.json (Already Created)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Railway Service Configuration
- **Port**: Railway auto-detects port 3000 for Next.js
- **Build**: Uses npm build command
- **Health Checks**: Automatic HTTP health checks
- **Auto-scaling**: Included in pro plans

## 6. Monitoring and Maintenance

### Railway Dashboard Features
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Database**: Connection monitoring
- **Backups**: Automatic database backups

### Database Management
```bash
# Connect to Railway PostgreSQL directly
railway connect postgres

# Run database studio (if needed)
railway run npx prisma studio

# Check database status
railway status
```

### Database Backups
```bash
# Manual backup via Railway CLI
railway run pg_dump $DATABASE_URL > backup.sql

# Restore backup
railway run psql $DATABASE_URL < backup.sql
```

## 7. Cost Management

### Railway Pricing (as of 2024)
- **Starter Plan**: $5/month credit (covers small databases)
- **Developer Plan**: $10/month (higher resource limits)
- **Team Plan**: $20/month (team features + more resources)

### Database Resource Usage
- **CPU**: PostgreSQL typically uses minimal CPU for document storage
- **Memory**: ~256MB-512MB for small to medium databases
- **Storage**: ~100MB-1GB for typical document storage
- **Network**: Varies with traffic, usually minimal

### Cost Optimization Tips
1. **Monitor Usage**: Check Railway dashboard regularly
2. **Optimize Queries**: Use Prisma query optimization
3. **Connection Pooling**: Railway handles this automatically
4. **Sleep Applications**: Enable for development environments
5. **Right-size Resources**: Start small and scale up

## 8. Security Best Practices

### Database Security
- **SSL Connections**: Enabled by default
- **Private Networking**: Database isolated from internet
- **Access Control**: Connection only via authenticated URLs
- **Automatic Updates**: Railway handles PostgreSQL updates

### Environment Variables
- **Secret Management**: Use Railway's encrypted variable storage
- **Rotation**: Rotate database passwords periodically
- **Access Control**: Limit team access to production variables
- **Audit Logs**: Monitor variable access and changes

## 9. Troubleshooting

### Common Issues

#### Connection Timeouts
```bash
# Check database status
railway status

# Test connection
railway run npx prisma db push
```

#### Migration Failures
```bash
# Reset migrations (careful - this deletes data!)
railway run npx prisma migrate reset --force

# Apply migrations manually
railway run npx prisma migrate deploy
```

#### SSL Connection Issues
```bash
# Add SSL parameters to DATABASE_URL if needed
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

### Performance Issues
```bash
# Check database performance
railway metrics

# Optimize slow queries
railway run npx prisma studio
```

### Getting Help
- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Community**: Discord and GitHub discussions
- **Support**: Available for paid plans

## 10. Production Checklist

### Before Going Live
- [ ] PostgreSQL database created and accessible
- [ ] All environment variables configured
- [ ] Database migrations deployed successfully
- [ ] Production data seeded
- [ ] Connection tested from Vercel
- [ ] Backup strategy configured
- [ ] Monitoring alerts set up

### After Deployment
- [ ] Monitor database performance
- [ ] Set up regular backups
- [ ] Monitor resource usage and costs
- [ ] Test application functionality
- [ ] Set up database maintenance schedule

## 11. Advanced Configuration

### Multiple Environments
```bash
# Create separate Railway projects for:
# - Development (optional)
# - Staging
# - Production

# Link to different projects
railway link [project-id]
```

### Database Replicas (Pro Feature)
- Read replicas for scaling
- Automatic failover
- Geographic distribution

### Custom Domains for Database
- Private networking
- VPC connectivity
- Custom SSL certificates

## Integration with Vercel

### Connecting Vercel to Railway Database
1. Copy DATABASE_URL from Railway
2. Add to Vercel environment variables
3. Deploy Vercel application
4. Test database connectivity

### Environment Variable Sync
```bash
# Export from Railway
railway variables list --json > variables.json

# Import to Vercel (manual process via dashboard)
```

This Railway setup provides a robust, scalable PostgreSQL database for the BRD-PRD App production deployment.