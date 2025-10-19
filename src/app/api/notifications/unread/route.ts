import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get unread notifications (using Insight model with notification_ prefix)
    const notifications = await prisma.insight.findMany({
      where: {
        userId,
        type: { startsWith: 'notification_' },
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.length;

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type.replace('notification_', ''),
        title: n.title,
        message: n.description,
        priority: n.priority,
        actionUrl: (n.data as any)?.actionUrl,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, notificationId } = await req.json();

    if (!userId || !notificationId) {
      return NextResponse.json({ error: 'User ID and notification ID required' }, { status: 400 });
    }

    // Mark as read (dismissed)
    await prisma.insight.update({
      where: { id: notificationId },
      data: { status: 'dismissed', dismissedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
