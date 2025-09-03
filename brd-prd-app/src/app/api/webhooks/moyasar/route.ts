import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyMoyasarWebhook, retrieveMoyasarPayment } from '@/lib/moyasar'
import { getTokenLimit } from '@/lib/stripe'

// Disable body parsing for raw webhook payload
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('x-moyasar-signature') || headersList.get('signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const isValid = verifyMoyasarWebhook(
      body,
      signature,
      process.env.MOYASAR_WEBHOOK_SECRET!
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    console.log(`Processing Moyasar webhook event: ${event.type}`)

    // Handle the event based on type
    switch (event.type) {
      case 'payment.paid':
        await handlePaymentPaid(event.data)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.data)
        break

      case 'payment.captured':
        await handlePaymentCaptured(event.data)
        break

      case 'payment.refunded':
        await handlePaymentRefunded(event.data)
        break

      default:
        console.log(`Unhandled Moyasar event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Moyasar webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle successful payment
async function handlePaymentPaid(payment: any) {
  try {
    const { userId, planKey, interval, priceId } = payment.metadata || {}

    if (!userId || !planKey) {
      console.error('Missing required metadata in payment:', payment.id)
      return
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.error('User not found for payment:', payment.id, 'userId:', userId)
      return
    }

    // Determine subscription tier and token limit
    const subscriptionTier = planKey.toUpperCase()
    const tokenLimit = getTokenLimit(planKey as any, interval)

    // Update user subscription status
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'active',
        subscriptionTier: subscriptionTier,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: interval === 'year' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days from now
        tokensUsed: 0,
        tokensLimit: tokenLimit,
        // Store Moyasar payment ID for reference
        moyasarCustomerId: payment.customer_id || payment.id,
      }
    })

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId: userId,
        tier: subscriptionTier,
        status: 'ACTIVE',
        billingCycle: interval === 'year' ? 'ANNUAL' : 'MONTHLY',
        amount: payment.amount / 100, // Convert from halala to SAR
        currency: payment.currency,
        moyasarPaymentId: payment.id,
        startDate: new Date(),
        endDate: interval === 'year'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tokensIncluded: tokenLimit,
      }
    })

    console.log(`✓ Subscription activated for user ${userId}, plan: ${planKey}`)

  } catch (error) {
    console.error('Error handling payment.paid:', error)
  }
}

// Handle failed payment
async function handlePaymentFailed(payment: any) {
  try {
    const { userId } = payment.metadata || {}

    if (!userId) {
      console.error('Missing userId in failed payment metadata:', payment.id)
      return
    }

    // Log the failure but don't update subscription status yet
    // User might retry the payment
    console.log(`⚠️ Payment failed for user ${userId}, payment: ${payment.id}`)

    // Optionally, you could store failed payment attempts for analytics
    // or send notification emails to the user

  } catch (error) {
    console.error('Error handling payment.failed:', error)
  }
}

// Handle captured payment (for payments that were authorized first)
async function handlePaymentCaptured(payment: any) {
  // This is similar to payment.paid, but for payments that were authorized first
  await handlePaymentPaid(payment)
}

// Handle refunded payment
async function handlePaymentRefunded(payment: any) {
  try {
    const { userId } = payment.metadata || {}

    if (!userId) {
      console.error('Missing userId in refunded payment metadata:', payment.id)
      return
    }

    // Find and cancel the subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        moyasarPaymentId: payment.id,
        status: 'ACTIVE'
      }
    })

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED' }
      })

      // Update user subscription status
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'cancelled',
          subscriptionTier: 'FREE',
          subscriptionEndDate: new Date(), // End immediately
          tokensLimit: getTokenLimit('free'), // Reset to free tier limits
        }
      })

      console.log(`✓ Subscription cancelled due to refund for user ${userId}`)
    }

  } catch (error) {
    console.error('Error handling payment.refunded:', error)
  }
}