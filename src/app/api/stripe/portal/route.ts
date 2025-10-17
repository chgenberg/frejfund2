import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe-utils';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const session = await createPortalSession(userId, `${origin}/dashboard`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
