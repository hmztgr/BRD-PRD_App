import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      adminPermissions?: string[]
      subscriptionTier?: string
      subscriptionStatus?: string
    } & DefaultSession["user"]
  }
}