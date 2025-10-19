import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Find VC user
    const vcUser = await prisma.vCUser.findUnique({
      where: { email },
    });

    if (!vcUser || vcUser.passwordHash !== passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate session token and set HttpOnly cookie
    const token = generateToken();

    const res = NextResponse.json({
      success: true,
      token,
      email: vcUser.email,
      name: vcUser.name,
      firm: vcUser.firm,
      role: vcUser.role,
      preferences: {
        industries: vcUser.industries,
        stages: vcUser.stages,
        minCheckSize: vcUser.minCheckSize,
        maxCheckSize: vcUser.maxCheckSize,
        geographies: vcUser.geographies,
      },
    });

    // Set secure, HttpOnly cookie to gate /vc pages server-side
    res.cookies.set('vc-session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error('VC login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
