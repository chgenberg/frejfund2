import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, newEmail } = await request.json();

    if (!sessionId || !newEmail) {
      return NextResponse.json({ error: 'Session ID and new email required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session || !session.userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== session.userId) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Update email
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { email: newEmail },
    });

    return NextResponse.json({
      success: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
