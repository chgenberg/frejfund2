// OAuth configuration for integrations
// In production, these would come from environment variables

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export const getOAuthConfig = (integrationId: string): OAuthConfig | null => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/oauth/callback`;

  const configs: Record<string, OAuthConfig> = {
    gmail: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
      ],
      redirectUri,
    },
    'google-calendar': {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ],
      redirectUri,
    },
    'google-analytics': {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      redirectUri,
    },
    stripe: {
      clientId: process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID || '',
      clientSecret: process.env.STRIPE_SECRET_KEY,
      authorizationUrl: 'https://connect.stripe.com/oauth/authorize',
      tokenUrl: 'https://connect.stripe.com/oauth/token',
      scopes: ['read_only'],
      redirectUri,
    },
    hubspot: {
      clientId: process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_ID || '',
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
      authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      scopes: ['contacts', 'content', 'reports', 'analytics.readonly'],
      redirectUri,
    },
    slack: {
      clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['channels:history', 'channels:read', 'users:read', 'team:read'],
      redirectUri,
    },
    pipedrive: {
      clientId: process.env.NEXT_PUBLIC_PIPEDRIVE_CLIENT_ID || '',
      clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET,
      authorizationUrl: 'https://oauth.pipedrive.com/oauth/authorize',
      tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
      scopes: ['deals:read', 'persons:read', 'organizations:read', 'activities:read'],
      redirectUri,
    },
  };

  return configs[integrationId] || null;
};

// Helper to generate OAuth URL with proper parameters
export const generateOAuthUrl = (integrationId: string, sessionId?: string): string | null => {
  const config = getOAuthConfig(integrationId);
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: JSON.stringify({ integrationId, sessionId }),
    access_type: 'offline',
    prompt: 'consent',
  });

  // Add integration-specific parameters
  if (integrationId === 'stripe') {
    params.set('response_type', 'code');
    params.set('stripe_user[email]', ''); // Pre-fill email if available
  }

  return `${config.authorizationUrl}?${params.toString()}`;
};
