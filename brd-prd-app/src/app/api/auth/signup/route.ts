import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateReferralCode } from '@/lib/utils';
import { sendVerificationEmail, generateVerificationToken } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, locale = 'en', referralCode } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Handle referral
    let referringUser = null;
    if (referralCode) {
      referringUser = await prisma.user.findUnique({
        where: { referralCode }
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        referralCode: generateReferralCode(),
        referredBy: referringUser?.id,
        language: locale,
        // Email verification will be done separately
        emailVerified: null
      }
    });

    // Generate verification token
    const verificationToken = await generateVerificationToken(user.id, email);

    // Send verification email
    const emailSent = await sendVerificationEmail(
      email, 
      name, 
      verificationToken, 
      locale as 'en' | 'ar'
    );

    if (!emailSent) {
      console.warn('Failed to send verification email, but user was created');
    }

    // Award referral bonus if applicable
    if (referringUser) {
      await prisma.user.update({
        where: { id: referringUser.id },
        data: {
          totalReferralTokens: {
            increment: 10000 // 10K tokens for referring a new user
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email for verification.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: false
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}