import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, STRIPE_PRICES, isStripeConfigured } from '@/lib/stripe-utils';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: 'Stripe not configured',
          message: 'Payments are disabled for testing. All users have Pro access.',
        },
        { status: 503 },
      );
    }

    const { userId, plan, interval } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Select price ID based on plan and interval
    let priceId: string;
    if (plan === 'pro') {
      priceId = interval === 'yearly' ? STRIPE_PRICES.pro_yearly : STRIPE_PRICES.pro_monthly;
    } else if (plan === 'enterprise') {
      priceId = STRIPE_PRICES.enterprise;
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession(
      userId,
      priceId,
      `${origin}/dashboard?upgrade=success`,
      `${origin}/dashboard?upgrade=canceled`,
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
