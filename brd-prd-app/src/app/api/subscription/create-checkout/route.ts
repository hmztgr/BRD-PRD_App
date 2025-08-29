import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession, createCustomer } from '@/lib/stripe'
// import { config } from '@/lib/config' // Temporarily disabled due to zod version issues

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, successPath = '/dashboard?checkout=success', cancelPath = '/dashboard?checkout=canceled' } = await req.json()

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

    let customerId = user.stripeCustomerId

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createCustomer({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          app: 'brd-prd-app',
        }
      })

      customerId = customer.id

      // Update user with customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${process.env.APP_URL}${successPath}`,
      cancelUrl: `${process.env.APP_URL}${cancelPath}`,
      metadata: {
        userId: user.id,
        userEmail: user.email,
      }
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    
    // Check if this is a Stripe price ID validation error
    if (error.message?.includes('No such price') || error.type === 'invalid_request_error') {
      return NextResponse.json(
        { 
          error: 'Invalid subscription plan. Please contact support or try again later.',
          details: 'The selected subscription plan is not properly configured. This usually happens in development mode.'
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