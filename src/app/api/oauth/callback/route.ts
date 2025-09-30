import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const errorDescription = searchParams.get('error_description') || 'Authorization failed';
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(errorDescription)}`, req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/integrations?error=Missing authorization code', req.url)
      );
    }

    // Parse state to get integration info
    let stateData: { integrationId: string; sessionId?: string };
    try {
      stateData = JSON.parse(state);
    } catch {
      return NextResponse.redirect(
        new URL('/integrations?error=Invalid state parameter', req.url)
      );
    }

    // In production, here we would:
    // 1. Exchange authorization code for access token
    // 2. Store encrypted tokens in database
    // 3. Set up webhook subscriptions if needed
    // 4. Start initial data sync

    const tokenExchangeHandlers: Record<string, (code: string) => Promise<any>> = {
      'gmail': async (code) => exchangeGoogleToken(code, 'gmail'),
      'google-calendar': async (code) => exchangeGoogleToken(code, 'calendar'),
      'google-analytics': async (code) => exchangeGoogleToken(code, 'analytics'),
      'stripe': async (code) => exchangeStripeToken(code),
      'hubspot': async (code) => exchangeHubSpotToken(code),
      'slack': async (code) => exchangeSlackToken(code),
    };

    const handler = tokenExchangeHandlers[stateData.integrationId];
    if (handler) {
      try {
        const tokenData = await handler(code);
        // Store token securely (encrypted in database)
        console.log('Token exchange successful for:', stateData.integrationId);
        
        // Redirect with success
        return NextResponse.redirect(
          new URL(`/integrations?connected=${stateData.integrationId}`, req.url)
        );
      } catch (error) {
        console.error('Token exchange failed:', error);
        return NextResponse.redirect(
          new URL(`/integrations?error=Failed to connect ${stateData.integrationId}`, req.url)
        );
      }
    }

    // Default redirect
    return NextResponse.redirect(new URL('/integrations', req.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=An unexpected error occurred', req.url)
    );
  }
}

// Token exchange functions (simplified for demo)
async function exchangeGoogleToken(code: string, service: string) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
    grant_type: 'authorization_code'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Google token');
  }

  return response.json();
}

async function exchangeStripeToken(code: string) {
  const tokenUrl = 'https://connect.stripe.com/oauth/token';
  const params = new URLSearchParams({
    code,
    client_secret: process.env.STRIPE_SECRET_KEY || '',
    grant_type: 'authorization_code'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Stripe token');
  }

  return response.json();
}

async function exchangeHubSpotToken(code: string) {
  const tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
  const params = new URLSearchParams({
    code,
    client_id: process.env.HUBSPOT_CLIENT_ID || '',
    client_secret: process.env.HUBSPOT_CLIENT_SECRET || '',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
    grant_type: 'authorization_code'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error('Failed to exchange HubSpot token');
  }

  return response.json();
}

async function exchangeSlackToken(code: string) {
  const tokenUrl = 'https://slack.com/api/oauth.v2.access';
  const params = new URLSearchParams({
    code,
    client_id: process.env.SLACK_CLIENT_ID || '',
    client_secret: process.env.SLACK_CLIENT_SECRET || '',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Slack token');
  }

  return response.json();
}
