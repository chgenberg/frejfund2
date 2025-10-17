import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleWebhookEvent, isStripeConfigured } from '@/lib/stripe-utils';

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!isStripeConfigured() || !stripe) {
    console.log('Stripe webhook called but Stripe is not configured (testing mode)');
    return NextResponse.json({ 
      error: 'Stripe not configured',
      message: 'Payments are disabled for testing'
    }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Handle the event
    await handleWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
