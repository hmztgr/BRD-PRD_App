/**
 * Stripe Configuration and Utilities
 * Handles payment processing, subscription management, and webhooks
 */

import Stripe from 'stripe';
// import { config } from './config';  // Temporarily disabled due to zod version issues

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  appInfo: {
    name: 'BRD-PRD App',
    version: '1.0.0',
  },
});

// Stripe product and price configuration
export const STRIPE_CONFIG = {
  products: {
    hobby: {
      name: 'Hobby Plan',
      description: 'Enhanced AI-powered generation for personal projects',
    },
    professional: {
      name: 'Professional Plan',
      description: 'Premium AI-powered document generation with advanced features',
    },
    business: {
      name: 'Business Plan', 
      description: 'Team collaboration with enhanced AI models and templates',
    },
    enterprise: {
      name: 'Enterprise Plan',
      description: 'Custom solutions with premium AI models and dedicated support',
    },
  },
  prices: {
    hobby_monthly: {
      amount: 380, // $3.80
      currency: 'usd',
      interval: 'month',
      productId: 'hobby',
    },
    hobby_yearly: {
      amount: 325, // $3.25 (annually)
      currency: 'usd',
      interval: 'year',
      productId: 'hobby',
    },
    professional_monthly: {
      amount: 1980, // $19.80
      currency: 'usd',
      interval: 'month',
      productId: 'professional',
    },
    professional_yearly: {
      amount: 1650, // $16.50 (annually)
      currency: 'usd', 
      interval: 'year',
      productId: 'professional',
    },
    business_monthly: {
      amount: 1680, // $16.80
      currency: 'usd',
      interval: 'month',
      productId: 'business',
    },
    business_yearly: {
      amount: 1480, // $14.80 (annually)
      currency: 'usd',
      interval: 'year', 
      productId: 'business',
    },
    enterprise_monthly: {
      amount: 19900, // $199.00
      currency: 'usd',
      interval: 'month',
      productId: 'enterprise',
    },
    enterprise_yearly: {
      amount: 14990, // $149.90 (annually)
      currency: 'usd',
      interval: 'year',
      productId: 'enterprise',
    },
  },
};

// Token limits for each plan
export const TOKEN_LIMITS = {
  free: 10000,        // 10K tokens/month
  hobby: 50000,       // 50K tokens/month
  professional: 100000, // 100K tokens/month
  business: 200000,    // 200K tokens/month  
  enterprise: 1000000, // 1M tokens/month
};

// Helper functions
export async function createCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        ...params.metadata,
        app: 'brd-prd-app',
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
}

export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription' 
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...params.metadata,
        app: 'brd-prd-app',
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription');
  }
}

export async function createCheckoutSession(params: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
}) {
  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        ...params.metadata,
        app: 'brd-prd-app',
      },
      subscription_data: {
        metadata: {
          ...params.metadata,
          app: 'brd-prd-app',
        },
      },
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw new Error('Failed to create portal session');
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

export async function updateSubscription(
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, params);
    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
}

export async function retrieveSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw new Error('Failed to retrieve subscription');
  }
}

// Utility functions
export function formatPrice(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function getPlanFromPriceId(priceId: string): {
  plan: keyof typeof TOKEN_LIMITS;
  interval: 'month' | 'year';
} | null {
  // Parse price ID format: price_<plan>_<interval>_<id>
  const parts = priceId.split('_');
  if (parts.length < 3) return null;

  const plan = parts[1] as keyof typeof TOKEN_LIMITS;
  const intervalPart = parts[2];
  
  // Map yearly to year, monthly to month
  const interval = intervalPart === 'yearly' ? 'year' : intervalPart === 'monthly' ? 'month' : intervalPart as 'month' | 'year';
  
  if (!TOKEN_LIMITS[plan] || !['month', 'year'].includes(interval)) {
    return null;
  }

  return { plan, interval };
}

export function getTokenLimit(plan: keyof typeof TOKEN_LIMITS, interval: 'month' | 'year' = 'month'): number {
  const baseLimit = TOKEN_LIMITS[plan];
  // 10% bonus tokens for yearly plans
  return interval === 'year' ? Math.floor(baseLimit * 1.1) : baseLimit;
}

// Setup products and prices in Stripe (run once during setup)
export async function setupStripeProducts() {
  try {
    console.log('Setting up Stripe products and prices...');

    for (const [productKey, productConfig] of Object.entries(STRIPE_CONFIG.products)) {
      // Create or update product
      let product;
      try {
        const products = await stripe.products.list({ 
          limit: 100,
          active: true 
        });
        product = products.data.find(p => p.metadata?.key === productKey);
        
        if (product) {
          product = await stripe.products.update(product.id, {
            name: productConfig.name,
            description: productConfig.description,
            metadata: { key: productKey, app: 'brd-prd-app' },
          });
        } else {
          product = await stripe.products.create({
            name: productConfig.name,
            description: productConfig.description,
            metadata: { key: productKey, app: 'brd-prd-app' },
          });
        }
      } catch (error) {
        console.error(`Error creating product ${productKey}:`, error);
        continue;
      }

      // Create prices for this product
      const productPrices = Object.entries(STRIPE_CONFIG.prices).filter(
        ([, priceConfig]) => priceConfig.productId === productKey
      );

      for (const [priceKey, priceConfig] of productPrices) {
        try {
          const existingPrices = await stripe.prices.list({
            product: product.id,
            active: true,
          });

          const existingPrice = existingPrices.data.find(
            p => p.metadata?.key === priceKey
          );

          if (!existingPrice) {
            await stripe.prices.create({
              product: product.id,
              currency: priceConfig.currency,
              unit_amount: priceConfig.amount,
              recurring: { interval: priceConfig.interval as Stripe.Price.Recurring.Interval },
              metadata: { 
                key: priceKey, 
                app: 'brd-prd-app',
                plan: productKey,
                interval: priceConfig.interval 
              },
            });
            
            console.log(`✓ Created price: ${priceKey}`);
          } else {
            console.log(`✓ Price exists: ${priceKey}`);
          }
        } catch (error) {
          console.error(`Error creating price ${priceKey}:`, error);
        }
      }
    }

    console.log('Stripe products and prices setup completed!');
  } catch (error) {
    console.error('Error setting up Stripe products:', error);
    throw error;
  }
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

export default stripe;