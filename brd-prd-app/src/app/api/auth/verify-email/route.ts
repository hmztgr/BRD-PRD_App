import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await verifyEmailToken(token, 'email_verification');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.'
    });

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin?error=invalid-token', req.url));
  }

  try {
    const result = await verifyEmailToken(token, 'email_verification');

    if (!result.success) {
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(result.error || 'verification-failed')}`, req.url));
    }

    return NextResponse.redirect(new URL('/auth/signin?message=email-verified', req.url));
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=verification-failed', req.url));
  }
}