import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateReferralCode } from "@/lib/utils"
import { 
  authenticateFallbackUser, 
  isDatabaseAvailable, 
  getFallbackUserSession,
  isFallbackUserId 
} from "@/lib/fallback-auth"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // OAuth providers COMPLETELY DISABLED to prevent Firebase/database issues
    // Only credentials-based authentication is enabled
    // DO NOT enable OAuth providers until Firebase quota issues are resolved
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('[Auth] Authorize attempt:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials')
          return null
        }

        // Check database availability and use fallback if needed
        const dbAvailable = await isDatabaseAvailable()
        
        if (!dbAvailable) {
          console.log('[Auth] Database unavailable, attempting fallback authentication')
          return await authenticateFallbackUser(credentials.email, credentials.password)
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              adminPermissions: true,
              // Get subscriptionTier as raw string to avoid enum conversion error
              subscriptionTier: false
            }
          })

          // Get subscriptionTier separately using raw query to avoid enum issues
          let subscriptionTier = 'FREE'
          if (user) {
            const tierResult = await prisma.$queryRaw<Array<{subscriptionTier: string}>>`
              SELECT "subscriptionTier" FROM users WHERE email = ${credentials.email} LIMIT 1
            `
            if (tierResult.length > 0) {
              subscriptionTier = tierResult[0].subscriptionTier
            }
          }

          if (!user) {
            console.log('[Auth] User not found in database:', credentials.email)
            return null
          }

          console.log('[Auth] User found:', user.email, 'Role:', user.role)

          // For OAuth users, password might be null
          if (!user.password) {
            console.log('[Auth] User has no password set')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('[Auth] Invalid password for:', credentials.email)
            return null
          }
          
          console.log('[Auth] Authentication successful for:', user.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: null, // user.image not selected to avoid enum issues
            role: user.role,
            adminPermissions: user.adminPermissions,
            subscriptionTier: subscriptionTier
          }
        } catch (error) {
          console.error('[Auth] Database error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback triggered:", { 
        provider: account?.provider, 
        email: user.email,
        userId: user.id 
      })
      
      // Always return true to let Prisma adapter handle everything
      return true
    },
    async jwt({ token, user, account, trigger }) {
      // Handle fallback user data on sign in
      if (user && (user as any).isFallbackUser) {
        console.log('[Auth] Processing fallback user in JWT callback')
        token.id = user.id
        token.email = user.email
        token.role = (user as any).role
        token.adminPermissions = (user as any).adminPermissions
        token.subscriptionTier = (user as any).subscriptionTier
        // subscriptionStatus not available in SQLite schema
        token.isFallbackUser = true
        return token
      }
      
      // Add referral code after user is created by adapter (only for regular users)
      if (user && (account?.provider === "google" || account?.provider === "linkedin")) {
        try {
          // Check if database is available first
          const dbAvailable = await isDatabaseAvailable()
          if (dbAvailable) {
            // Check if user needs referral code
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id }
            })
            
            if (dbUser && !dbUser.referralCode) {
              console.log("Adding referral code to new OAuth user")
              await prisma.user.update({
                where: { id: user.id },
                data: { referralCode: generateReferralCode() }
              })
            }
          }
        } catch (error) {
          console.error("Error adding referral code:", error)
        }
      }
      
      if (user) {
        token.id = user.id
      }
      
      // Handle fallback users in subsequent requests
      if (token.isFallbackUser && token.email) {
        const fallbackData = getFallbackUserSession(token.email as string)
        if (fallbackData) {
          Object.assign(token, fallbackData)
        }
        return token
      }
      
      // Fetch and include user role and permissions in the token for middleware access
      // This runs on every token refresh, so we get up-to-date role information
      if (token.id && (trigger === 'signIn' || trigger === 'update' || !token.role)) {
        try {
          // Check database availability for session updates
          const dbAvailable = await isDatabaseAvailable()
          
          if (!dbAvailable) {
            console.log('[Auth] Database unavailable, using fallback session data')
            return token
          }
          
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              email: true,
              role: true,
              adminPermissions: true,
              subscriptionTier: false, // Avoid enum issue
              totalReferralTokens: true
            }
          })

          // Get subscriptionTier separately using raw query to avoid enum issues
          let userSubscriptionTier = 'FREE'
          if (dbUser) {
            const tierResult = await prisma.$queryRaw<Array<{subscriptionTier: string}>>`
              SELECT "subscriptionTier" FROM users WHERE id = ${token.id as string} LIMIT 1
            `
            if (tierResult.length > 0) {
              userSubscriptionTier = tierResult[0].subscriptionTier
            }
          }
          
          if (dbUser) {
            // Use database role if set, otherwise determine from permissions/email
            const adminEmails = ['admin@smartdocs.ai', 'hamza@smartdocs.ai']
            const hasAdminPerms = dbUser.adminPermissions && Array.isArray(dbUser.adminPermissions) && dbUser.adminPermissions.length > 0
            const isEmailAdmin = adminEmails.includes(dbUser.email || '')
            
            // Prefer database role, fallback to computed role
            let userRole = 'user'
            if (dbUser.role) {
              userRole = dbUser.role
            } else if (hasAdminPerms || isEmailAdmin) {
              userRole = 'admin'
            }
            
            token.role = userRole
            
            // Parse adminPermissions if it's a JSON string
            let permissions = []
            if (dbUser.adminPermissions) {
              try {
                permissions = typeof dbUser.adminPermissions === 'string' 
                  ? JSON.parse(dbUser.adminPermissions)
                  : dbUser.adminPermissions
              } catch (e) {
                console.error('Error parsing adminPermissions:', e)
                permissions = []
              }
            }
            token.adminPermissions = permissions
            token.subscriptionTier = userSubscriptionTier?.toLowerCase() || 'free'
            token.totalReferralTokens = dbUser.totalReferralTokens || 0
          }
        } catch (error) {
          console.error("Error fetching user role for token:", error)
          // Temporarily disable fallback - just continue with existing token data
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        
        // Include role information from token (already fetched in jwt callback)
        session.user.role = token.role as string
        session.user.adminPermissions = token.adminPermissions as string[] || []
        session.user.subscriptionTier = token.subscriptionTier as string || 'free'
        session.user.totalReferralTokens = token.totalReferralTokens as number || 0
        
        // Mark if this is a fallback user for debugging/monitoring
        if (token.isFallbackUser) {
          (session.user as any).isFallbackUser = true
          console.log('[Auth] Session created for fallback user:', session.user.email)
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/en/auth/signin",
    error: "/en/auth/signin",
    signOut: "/en",
  },
  secret: process.env.NEXTAUTH_SECRET,
}