import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, locale = 'en' } = await req.json();

    console.log('Testing email verification system...');

    // Call the signup API
    const signupResponse = await fetch(`${req.nextUrl.origin}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, locale })
    });

    const signupResult = await signupResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Email verification test completed',
      signupResponse: {
        status: signupResponse.status,
        data: signupResult
      },
      testData: { name, email, locale }
    });

  } catch (error: any) {
    console.error('Email verification test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test email verification',
    description: 'Test the complete email verification flow',
    examplePayload: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      locale: 'en'
    }
  });
}