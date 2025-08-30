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
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    // LinkedInProvider({
    //   clientId: process.env.LINKEDIN_CLIENT_ID!,
    //   clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    // }),
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

        // Check if database is available
        const dbAvailable = await isDatabaseAvailable()
        
        if (!dbAvailable) {
          console.log('[Auth] Database unavailable, attempting fallback authentication')
          return await authenticateFallbackUser(credentials.email, credentials.password)
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log('[Auth] User not found in database, trying fallback:', credentials.email)
            return await authenticateFallbackUser(credentials.email, credentials.password)
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
            image: user.image,
          }
        } catch (error) {
          console.error('[Auth] Database error, falling back to emergency auth:', error)
          return await authenticateFallbackUser(credentials.email, credentials.password)
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
          // Check if database is available
          const dbAvailable = await isDatabaseAvailable()
          
          if (!dbAvailable) {
            console.log('[Auth] Database unavailable, using fallback session data')
            // If database is down, use fallback data if available
            if (token.email === 'admin@smartdocs.ai') {
              const fallbackData = getFallbackUserSession(token.email as string)
              if (fallbackData) {
                Object.assign(token, fallbackData)
              }
            }
            return token
          }
          
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              email: true,
              role: true,
              adminPermissions: true,
              subscriptionTier: true,
              systemRole: true,
              totalReferralTokens: true
            }
          })
          
          if (dbUser) {
            // Use database role if set, otherwise determine from permissions/email
            const adminEmails = ['admin@smartdocs.ai', 'hamza@smartdocs.ai']
            const hasAdminPerms = dbUser.adminPermissions && Array.isArray(dbUser.adminPermissions) && dbUser.adminPermissions.length > 0
            const isEmailAdmin = adminEmails.includes(dbUser.email || '')
            const isSystemAdmin = dbUser.systemRole === 'SUPER_ADMIN' || dbUser.systemRole === 'SUB_ADMIN'
            
            // Prefer systemRole, then database role, fallback to computed role
            let userRole = 'user'
            if (isSystemAdmin) {
              userRole = dbUser.systemRole === 'SUPER_ADMIN' ? 'super_admin' : 'admin'
            } else if (dbUser.role) {
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
            token.subscriptionTier = dbUser.subscriptionTier?.toLowerCase() || 'free'
            token.totalReferralTokens = dbUser.totalReferralTokens || 0
          }
        } catch (error) {
          console.error("Error fetching user role for token:", error)
          // If error and this is the admin email, use fallback
          if (token.email === 'admin@smartdocs.ai') {
            const fallbackData = getFallbackUserSession(token.email as string)
            if (fallbackData) {
              Object.assign(token, fallbackData)
            }
          }
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