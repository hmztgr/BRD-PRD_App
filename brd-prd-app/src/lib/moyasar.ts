/**
 * Moyasar Payment Gateway Configuration and Utilities
 * Handles payment processing for Arabic countries (primarily Saudi Arabia)
 */

// Moyasar API configuration
export const MOYASAR_CONFIG = {
  baseUrl: 'https://api.moyasar.com/v1',
  products: {
    hobby: {
      name: 'خطة الهواة',
      description: 'إنشاء محسّن بالذكاء الاصطناعي للمشاريع الشخصية',
    },
    professional: {
      name: 'الخطة الاحترافية', 
      description: 'إنشاء مستندات متميز بالذكاء الاصطناعي مع ميزات متقدمة',
    },
    business: {
      name: 'خطة الأعمال',
      description: 'كل شيء في الاحترافي بالإضافة إلى التعاون الجماعي والنماذج المحسّنة',
    },
    enterprise: {
      name: 'خطة المؤسسات',
      description: 'حلول مخصصة مع نماذج ذكاء اصطناعي متميزة ودعم ذو أولوية',
    },
  },
  prices: {
    // Monthly prices in SAR (halala - smallest unit, 1 SAR = 100 halala)
    hobby_monthly: {
      amount: 1425, // 14.25 SAR ($3.80 * 3.75)
      currency: 'SAR',
      interval: 'month',
      productId: 'hobby',
    },
    hobby_yearly: {
      amount: 12825, // 128.25 SAR ($34.20 * 3.75)
      currency: 'SAR',
      interval: 'year',
      productId: 'hobby',
    },
    professional_monthly: {
      amount: 5550, // 55.50 SAR ($14.80 * 3.75)
      currency: 'SAR',
      interval: 'month',
      productId: 'professional',
    },
    professional_yearly: {
      amount: 49950, // 499.50 SAR ($133.20 * 3.75)
      currency: 'SAR',
      interval: 'year',
      productId: 'professional',
    },
    business_monthly: {
      amount: 11175, // 111.75 SAR ($29.80 * 3.75)
      currency: 'SAR',
      interval: 'month',
      productId: 'business',
    },
    business_yearly: {
      amount: 100575, // 1005.75 SAR ($268.20 * 3.75)
      currency: 'SAR',
      interval: 'year',
      productId: 'business',
    },
    enterprise_monthly: {
      amount: 22425, // 224.25 SAR ($59.80 * 3.75)
      currency: 'SAR',
      interval: 'month',
      productId: 'enterprise',
    },
    enterprise_yearly: {
      amount: 201825, // 2018.25 SAR ($538.20 * 3.75)
      currency: 'SAR',
      interval: 'year',
      productId: 'enterprise',
    },
  },
};

interface MoyasarPaymentParams {
  amount: number;
  currency: string;
  description: string;
  source: {
    type: 'creditcard' | 'applepay' | 'stcpay';
  };
  callback_url: string;
  metadata?: Record<string, string>;
}

interface MoyasarPayment {
  id: string;
  status: 'pending' | 'paid' | 'failed' | 'authorized';
  amount: number;
  currency: string;
  description: string;
  invoice_id?: string;
  source: {
    type: string;
    name?: string;
    number?: string;
    gateway_id?: string;
  };
  refunded?: number;
  captured?: number;
  callback_url: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, string>;
}

interface MoyasarSubscriptionParams {
  plan: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  interval_count: number;
}

// Initialize Moyasar configuration
export const moyasar = {
  apiKey: process.env.MOYASAR_API_KEY!,
  secretKey: process.env.MOYASAR_SECRET_KEY!,
  baseUrl: MOYASAR_CONFIG.baseUrl,
};

// Helper function to make authenticated requests to Moyasar API
async function moyasarRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${moyasar.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${Buffer.from(`${moyasar.secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Moyasar API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

// Create a payment intent
export async function createMoyasarPayment(params: {
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}): Promise<MoyasarPayment> {
  try {
    const paymentData: MoyasarPaymentParams = {
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      source: { type: 'creditcard' },
      callback_url: params.callbackUrl,
      metadata: {
        ...params.metadata,
        app: 'brd-prd-app',
      },
    };

    const payment = await moyasarRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });

    return payment;
  } catch (error) {
    console.error('Error creating Moyasar payment:', error);
    throw new Error('Failed to create payment');
  }
}

// Create a subscription (manual handling for now)
export async function createMoyasarSubscription(params: {
  customerId: string;
  planKey: string;
  interval: 'month' | 'year';
  metadata?: Record<string, string>;
}) {
  // Note: Moyasar doesn't have built-in subscriptions like Stripe
  // We'll handle recurring billing manually through webhooks and scheduled payments
  
  const priceKey = `${params.planKey}_${params.interval === 'year' ? 'yearly' : 'monthly'}` as keyof typeof MOYASAR_CONFIG.prices;
  const priceConfig = MOYASAR_CONFIG.prices[priceKey];
  
  if (!priceConfig) {
    throw new Error(`Price configuration not found for: ${priceKey}`);
  }

  // Create the first payment
  const payment = await createMoyasarPayment({
    amount: priceConfig.amount,
    currency: priceConfig.currency,
    description: `${MOYASAR_CONFIG.products[params.planKey as keyof typeof MOYASAR_CONFIG.products].name} - ${params.interval === 'year' ? 'سنوي' : 'شهري'}`,
    callbackUrl: `${process.env.APP_URL}/api/webhooks/moyasar`,
    metadata: {
      ...params.metadata,
      customerId: params.customerId,
      planKey: params.planKey,
      interval: params.interval,
      subscriptionType: 'recurring',
    },
  });

  return payment;
}

// Retrieve a payment
export async function retrieveMoyasarPayment(paymentId: string): Promise<MoyasarPayment> {
  try {
    const payment = await moyasarRequest(`/payments/${paymentId}`);
    return payment;
  } catch (error) {
    console.error('Error retrieving Moyasar payment:', error);
    throw new Error('Failed to retrieve payment');
  }
}

// Capture an authorized payment
export async function captureMoyasarPayment(paymentId: string, amount?: number): Promise<MoyasarPayment> {
  try {
    const captureData = amount ? { amount } : {};
    const payment = await moyasarRequest(`/payments/${paymentId}/capture`, {
      method: 'POST',
      body: JSON.stringify(captureData),
    });
    return payment;
  } catch (error) {
    console.error('Error capturing Moyasar payment:', error);
    throw new Error('Failed to capture payment');
  }
}

// Refund a payment
export async function refundMoyasarPayment(paymentId: string, amount?: number): Promise<MoyasarPayment> {
  try {
    const refundData = amount ? { amount } : {};
    const payment = await moyasarRequest(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
    return payment;
  } catch (error) {
    console.error('Error refunding Moyasar payment:', error);
    throw new Error('Failed to refund payment');
  }
}

// Format SAR price
export function formatSARPrice(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(amount / 100); // Convert from halala to SAR
}

// Get plan from Moyasar price configuration
export function getPlanFromMoyasarPrice(priceKey: string): {
  plan: string;
  interval: 'month' | 'year';
} | null {
  const parts = priceKey.split('_');
  if (parts.length < 2) return null;

  const plan = parts[0];
  const intervalPart = parts[1];
  const interval = intervalPart === 'yearly' ? 'year' : intervalPart === 'monthly' ? 'month' : intervalPart as 'month' | 'year';

  if (!MOYASAR_CONFIG.products[plan as keyof typeof MOYASAR_CONFIG.products] || !['month', 'year'].includes(interval)) {
    return null;
  }

  return { plan, interval };
}

// Verify webhook signature (Moyasar uses HMAC-SHA256)
export function verifyMoyasarWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Moyasar webhook signature verification failed:', error);
    return false;
  }
}

export default moyasar;