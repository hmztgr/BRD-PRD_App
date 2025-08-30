# Supabase Database Connection Troubleshooting Guide

## Issue Identified
- **Problem**: IPv6 connectivity issue with Supabase PostgreSQL
- **Error**: `connect ENETUNREACH` with IPv6 address
- **Root Cause**: System attempting IPv6 connection when IPv4 is required

## Solutions Available

### 1. IPv4 Force Connection (Recommended)
```bash
# Use the auto-generated IPv4 connection
cp .env.local.fixed .env.local
npm run dev
```

### 2. PgBouncer Connection Pooler
```bash
# Use connection pooling (more stable for production)
cp .env.local.pooler .env.local
npm run dev
```

### 3. Local SQLite Development
```bash
# For local development only
cp .env.local.sqlite .env.local
npx prisma db push
npm run dev
```

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
```bash
# Test different connection methods
node scripts/db-connection-diagnostic.js

# Test with curl (if available)
curl -v telnet://db.nutehrmyxqyzhfppsknk.supabase.co:5432

# Check DNS resolution
nslookup db.nutehrmyxqyzhfppsknk.supabase.co
```

## Environment Files Created

- `.env.local.fixed` - IPv4 connection
- `.env.local.pooler` - PgBouncer connection  
- `.env.local.sqlite` - Local SQLite fallback
- `.env.local.backup` - Original backup

## Next Steps

1. **Try IPv4 connection first** (most likely to work)
2. **If still failing**, check Supabase dashboard
3. **For development**, use SQLite locally
4. **For production**, ensure proper SSL and connection pooling

## Common Error Patterns

- `ENETUNREACH` → IPv6/IPv4 issue (use IPv4 fix)
- `ECONNREFUSED` → Port/firewall issue
- `ETIMEDOUT` → Network timeout (try pooler)
- `authentication failed` → Wrong credentials
- `too many connections` → Use connection pooling

## Production Recommendations

- Use connection pooling (PgBouncer)
- Enable SSL certificate validation
- Set appropriate connection limits
- Monitor connection usage
- Use environment-specific connection strings
