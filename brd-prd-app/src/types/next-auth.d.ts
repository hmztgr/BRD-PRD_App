import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      adminPermissions?: string[]
      subscriptionTier?: string
      subscriptionStatus?: string
      totalReferralTokens?: number
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    role?: string
    adminPermissions?: string[]
    subscriptionTier?: string
    subscriptionStatus?: string
    totalReferralTokens?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    adminPermissions?: string[]
    subscriptionTier?: string
    subscriptionStatus?: string
    totalReferralTokens?: number
  }
}