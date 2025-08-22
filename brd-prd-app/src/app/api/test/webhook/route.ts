import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Create a test webhook payload
    const testPayload = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
          current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
          items: {
            data: [{
              price: {
                id: 'price_test123',
                metadata: {
                  plan: 'professional',
                  interval: 'month'
                }
              }
            }]
          }
        }
      }
    };

    console.log('Testing webhook with payload:', JSON.stringify(testPayload, null, 2));

    // Call our webhook handler
    const webhookResponse = await fetch(`${req.nextUrl.origin}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // This will fail signature verification, which is expected in test
      },
      body: JSON.stringify(testPayload)
    });

    const result = await webhookResponse.text();
    
    return NextResponse.json({
      success: true,
      message: 'Webhook test completed',
      webhookResponse: {
        status: webhookResponse.status,
        body: result
      },
      testPayload
    });

  } catch (error: any) {
    console.error('Webhook test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test webhook functionality',
    description: 'This endpoint tests the webhook handler with a sample payload'
  });
}