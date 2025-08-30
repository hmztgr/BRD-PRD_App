import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateReferralCode, isValidEmail } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, referredBy } = await req.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Handle referral
    let referredByUser = null
    if (referredBy) {
      referredByUser = await prisma.user.findUnique({
        where: { referralCode: referredBy }
      })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        referralCode: generateReferralCode(),
        referredBy: referredByUser?.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
      }
    })

    // Create referral reward for the referrer if applicable
    if (referredByUser) {
      await prisma.referralReward.create({
        data: {
          userId: referredByUser.id,
          type: "signup",
          tokens: 10000, // 10K tokens for new user signup
          description: `Referral bonus for ${email} signing up`,
          referredId: user.id,
        }
      })

      // Update referrer's token count
      await prisma.user.update({
        where: { id: referredByUser.id },
        data: {
          totalReferralTokens: {
            increment: 10000
          }
        }
      })
    }

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          referralCode: user.referralCode
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}