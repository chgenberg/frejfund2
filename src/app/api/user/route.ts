import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET user by email or create if doesn't exist
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split('@')[0], // Default name from email
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create or update user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, company, industry, stage, website } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        company,
        industry,
        stage,
        website,
      },
      create: {
        email,
        name,
        company,
        industry,
        stage,
        website,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User create/update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
