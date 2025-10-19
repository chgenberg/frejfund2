import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession, isStripeConfigured } from '@/lib/stripe-utils';

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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createPortalSession(userId, `${origin}/dashboard`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
