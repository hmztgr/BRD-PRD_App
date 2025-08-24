import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateReferralCode } from "@/lib/utils"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    async jwt({ token, user, account }) {
      // Add referral code after user is created by adapter
      if (user && account?.provider === "google") {
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
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
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