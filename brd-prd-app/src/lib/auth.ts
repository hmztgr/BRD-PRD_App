import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateReferralCode } from "@/lib/utils"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // For OAuth users, password might be null
        if (!user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
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
      // Add referral code after user is created by adapter
      if (user && (account?.provider === "google" || account?.provider === "linkedin")) {
        try {
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
        } catch (error) {
          console.error("Error adding referral code:", error)
        }
      }
      
      if (user) {
        token.id = user.id
      }
      
      // Fetch and include user role and permissions in the token for middleware access
      // This runs on every token refresh, so we get up-to-date role information
      if (token.id && (trigger === 'signIn' || trigger === 'update' || !token.role)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              email: true,
              role: true,
              adminPermissions: true,
              subscriptionTier: true,
              subscriptionStatus: true
            }
          })
          
          if (dbUser) {
            // Use database role if set, otherwise determine from permissions/email
            const adminEmails = ['admin@smartdocs.ai', 'hamza@smartdocs.ai']
            const hasAdminPerms = dbUser.adminPermissions && Array.isArray(dbUser.adminPermissions) && dbUser.adminPermissions.length > 0
            const isEmailAdmin = adminEmails.includes(dbUser.email || '')
            
            // Prefer database role, fallback to computed role
            token.role = dbUser.role || ((hasAdminPerms || isEmailAdmin) ? 'admin' : 'user')
            token.adminPermissions = dbUser.adminPermissions as string[] || []
            token.subscriptionTier = dbUser.subscriptionTier.toLowerCase()
            token.subscriptionStatus = dbUser.subscriptionStatus
          }
        } catch (error) {
          console.error("Error fetching user role for token:", error)
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
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
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