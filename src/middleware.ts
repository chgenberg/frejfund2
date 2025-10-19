import { NextResponse, NextRequest } from 'next/server';

export const config = {
  matcher: ['/vc/:path*', '/api/:path*'],
};

// Simple in-memory rate limiter (edge runtime resets per instance; good enough as a guard)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120; // per IP per minute
const ipHits: Map<string, { count: number; resetAt: number }> = new Map();

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const isLogin = url.pathname.startsWith('/vc/login');
  const token = req.cookies.get('vc-session')?.value;

  // If requesting protected VC routes without a cookie → redirect to login
  if (!isLogin && url.pathname.startsWith('/vc') && !token) {
    url.pathname = '/vc/login';
    return NextResponse.redirect(url);
  }

  // Basic rate limit for API routes
  if (url.pathname.startsWith('/api/')) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const entry = ipHits.get(ip as string);
    if (!entry || entry.resetAt < now) {
      ipHits.set(ip as string, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      entry.count += 1;
      if (entry.count > RATE_LIMIT_MAX) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  }

  const res = NextResponse.next();
  // Security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload');
  // Light CSP (relaxed for Next.js, can be tightened later)
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; font-src 'self' https: data:",
  );
  return res;
}
