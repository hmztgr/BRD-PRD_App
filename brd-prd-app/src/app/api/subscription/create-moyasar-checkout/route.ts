import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createMoyasarPayment, MOYASAR_CONFIG } from '@/lib/moyasar'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      priceId, 
      successPath = '/dashboard?checkout=success', 
      cancelPath = '/dashboard?checkout=canceled' 
    } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has an active subscription
    if (user.subscriptionStatus === 'active' && user.subscriptionTier !== 'FREE') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Parse the price ID to get plan and interval
    // Expected format: hobby_monthly, hobby_yearly, etc.
    const priceParts = priceId.split('_');
    if (priceParts.length < 2) {
      return NextResponse.json({ error: 'Invalid price ID format' }, { status: 400 })
    }

    const planKey = priceParts[0] as keyof typeof MOYASAR_CONFIG.products;
    const intervalKey = priceParts[1];
    const moyasarPriceKey = `${planKey}_${intervalKey}` as keyof typeof MOYASAR_CONFIG.prices;

    const priceConfig = MOYASAR_CONFIG.prices[moyasarPriceKey];
    if (!priceConfig) {
      return NextResponse.json({ error: 'Price configuration not found' }, { status: 400 })
    }

    const productConfig = MOYASAR_CONFIG.products[planKey];
    if (!productConfig) {
      return NextResponse.json({ error: 'Product configuration not found' }, { status: 400 })
    }

    // Create Moyasar payment
    const payment = await createMoyasarPayment({
      amount: priceConfig.amount,
      currency: priceConfig.currency,
      description: `${productConfig.name} - ${intervalKey === 'yearly' ? 'سنوي' : 'شهري'}`,
      callbackUrl: `${process.env.APP_URL}/api/webhooks/moyasar`,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        planKey: planKey,
        interval: intervalKey,
        priceId: priceId,
        successPath: successPath,
        cancelPath: cancelPath,
        subscriptionType: 'new',
      }
    });

    // Store payment ID in user record for tracking
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        // Add a field to track pending Moyasar payment
        // You might need to add this field to your User model
      }
    });

    // Return payment information for frontend to handle
    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      // Note: Moyasar typically returns a payment URL or requires client-side handling
      // You'll need to implement the appropriate flow based on Moyasar's documentation
      checkoutUrl: `https://moyasar.com/payment/${payment.id}`, // This is a placeholder
      metadata: payment.metadata
    });

  } catch (error: any) {
    console.error('Error creating Moyasar checkout:', error)
    
    // Check if this is a Moyasar-specific error
    if (error.message?.includes('Moyasar API error')) {
      return NextResponse.json(
        { 
          error: 'Payment service temporarily unavailable. Please try again later.',
          details: error.message
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}