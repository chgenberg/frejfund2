import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    // Find magic link
    const magicLink = await prisma.magicLink.findUnique({
      where: { token }
    });

    if (!magicLink) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    // Check if expired
    if (magicLink.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/login?error=expired', req.url));
    }

    // Check if already used
    if (magicLink.used) {
      return NextResponse.redirect(new URL('/login?error=already_used', req.url));
    }

    // Mark as used
    await prisma.magicLink.update({
      where: { token },
      data: { used: true }
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: magicLink.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: magicLink.email,
          name: magicLink.email.split('@')[0] // Use email prefix as default name
        }
      });
    }

    // Get user's sessions
    const sessions = await prisma.session.findMany({
      where: { email: magicLink.email },
      orderBy: { lastActivity: 'desc' },
      take: 10
    });

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(
        sessions.length > 0 
          ? `/login?email=${encodeURIComponent(magicLink.email)}&authenticated=true`
          : '/?start=true',
        req.url
      )
    );

    // Set auth cookie
    response.cookies.set('frejfund-auth-email', magicLink.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}

