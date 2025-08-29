-- Initialize Development Database
-- Run this in Supabase SQL Editor

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" TIMESTAMPTZ,
    image TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "companyName" TEXT,
    industry TEXT,
    "companySize" TEXT,
    location TEXT,
    language TEXT DEFAULT 'en',
    timezone TEXT,
    "subscriptionTier" TEXT DEFAULT 'FREE',
    "subscriptionStatus" TEXT DEFAULT 'inactive',
    "tokensUsed" INTEGER DEFAULT 0,
    "tokensLimit" INTEGER DEFAULT 10000,
    "billingCycle" TEXT DEFAULT 'monthly',
    "subscriptionEndsAt" TIMESTAMPTZ,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    role TEXT DEFAULT 'user',
    "adminPermissions" TEXT[],
    "referralCode" TEXT UNIQUE,
    "referredBy" TEXT,
    "totalReferralTokens" INTEGER DEFAULT 0
);

-- Insert admin user
INSERT INTO users (
    id,
    email, 
    password,
    name,
    role,
    "adminPermissions",
    "subscriptionTier",
    "subscriptionStatus",
    "emailVerified",
    "referralCode"
) VALUES (
    'admin_' || gen_random_uuid()::text,
    'admin@smartdocs.ai',
    -- Password: admin123 (bcrypt hash)
    '$2a$12$YL6L5hR0c8Y3V9tXwqvYfOxF6Kk5NqL4C6yXvR.WJg6oJ3gH.W5zy',
    'System Admin',
    'admin',
    ARRAY['manage_users', 'manage_content', 'view_analytics', 'manage_billing', 'manage_settings'],
    'PROFESSIONAL',
    'ACTIVE',
    NOW(),
    'ADMIN_DEV'
) ON CONFLICT (email) 
DO UPDATE SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "adminPermissions" = EXCLUDED."adminPermissions";

-- Verify admin was created
SELECT id, email, role, "adminPermissions" 
FROM users 
WHERE email = 'admin@smartdocs.ai';