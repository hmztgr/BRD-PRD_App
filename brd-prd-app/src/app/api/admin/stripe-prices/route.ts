import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    // Basic security check - only allow in development or for admins
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
    }

    console.log('Fetching Stripe prices...')
    
    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product']
    })
    
    // Fetch all products to get metadata
    const products = await stripe.products.list({
      active: true,
      limit: 100
    })
    
    return NextResponse.json({ 
      success: true,
      prices: prices.data.map(price => ({
        id: price.id,
        product: price.product,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        metadata: price.metadata,
        created: price.created
      })),
      products: products.data.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata,
        created: product.created
      }))
    })
    
  } catch (error: any) {
    console.error('Error fetching Stripe prices:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch prices', 
      details: error.message,
      type: error.type || 'unknown'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Use GET to fetch Stripe prices',
    note: 'This endpoint lists all active prices and products from your Stripe account'
  })
}