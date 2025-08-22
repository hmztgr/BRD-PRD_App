import { NextRequest, NextResponse } from 'next/server';
import { setupStripeProducts } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    // Basic security check - only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    console.log('Setting up Stripe products...');
    await setupStripeProducts();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe products setup completed successfully!' 
    });
  } catch (error: any) {
    console.error('Stripe setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to setup Stripe products',
    note: 'Make sure STRIPE_SECRET_KEY is set in .env.local'
  });
}