/**
 * Notification service for matching events
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export type NotificationType =
  | 'new_match' // VC: new startup matches your criteria
  | 'vc_interest' // Founder: VC showed interest
  | 'intro_request' // Founder: VC requested intro
  | 'intro_accepted' // VC: Founder accepted your intro
  | 'message_received'; // Either: new message in match thread

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create in-app notification
 */
export async function createNotification(data: NotificationData) {
  try {
    // For now, use Insight model as notification store (can migrate to dedicated table later)
    await prisma.insight.create({
      data: {
        userId: data.userId,
        type: `notification_${data.type}`,
        title: data.title,
        description: data.message,
        priority: data.type === 'intro_request' ? 'high' : 'medium',
        category: 'notifications',
        data: {
          actionUrl: data.actionUrl,
          ...data.metadata,
        },
        status: 'active',
      },
    });
    logger.info('notification_created', { userId: data.userId, type: data.type });
  } catch (error) {
    logger.error('notification_creation_failed', { error: String(error) });
  }
}

/**
 * Send email notification (placeholder - integrate with mailer)
 */
export async function sendEmailNotification(
  email: string,
  subject: string,
  body: string,
  actionUrl?: string,
) {
  try {
    // TODO: Integrate with your email service (SendGrid, etc.)
    logger.info('email_notification_queued', { email, subject });
    // For now, just log
    console.log(`📧 Email queued: ${email} - ${subject}`);
  } catch (error) {
    logger.error('email_notification_failed', { error: String(error) });
  }
}

/**
 * Notify VCs when a new startup matches their criteria
 */
export async function notifyVCsOfNewStartup(
  startupUserId: string,
  startupName: string,
  matchScore: number,
  vcEmail: string,
  vcUserId?: string,
) {
  const title = `New Match: ${startupName}`;
  const message = `${startupName} (${matchScore}% match) just completed their investment readiness analysis and matches your investment criteria.`;

  // In-app notification (if VC has userId)
  if (vcUserId) {
    await createNotification({
      userId: vcUserId,
      type: 'new_match',
      title,
      message,
      actionUrl: `/vc/startup/${startupUserId}`,
      metadata: { startupUserId, matchScore },
    });
  }

  // Email notification
  await sendEmailNotification(
    vcEmail,
    title,
    `${message}\n\nView profile: ${process.env.NEXT_PUBLIC_APP_URL}/vc/startup/${startupUserId}`,
    `/vc/startup/${startupUserId}`,
  );
}

/**
 * Notify founder when VC shows interest
 */
export async function notifyFounderOfVCInterest(
  founderId: string,
  vcName: string,
  vcFirm: string,
  interestType: 'swipe' | 'intro_request',
) {
  const title =
    interestType === 'intro_request'
      ? `${vcFirm} wants to connect!`
      : `${vcFirm} is interested`;
  const message =
    interestType === 'intro_request'
      ? `${vcName} from ${vcFirm} has requested an introduction. Review and respond.`
      : `${vcName} from ${vcFirm} showed interest in your startup.`;

  await createNotification({
    userId: founderId,
    type: interestType === 'intro_request' ? 'intro_request' : 'vc_interest',
    title,
    message,
    actionUrl: '/dashboard',
    metadata: { vcName, vcFirm, interestType },
  });

  // Get founder email
  const founder = await prisma.user.findUnique({
    where: { id: founderId },
    select: { email: true, name: true },
  });

  if (founder?.email) {
    await sendEmailNotification(
      founder.email,
      title,
      `Hi ${founder.name || 'there'},\n\n${message}\n\nLog in to view: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      '/dashboard',
    );
  }
}

/**
 * Notify VC when founder accepts intro
 */
export async function notifyVCOfIntroAcceptance(
  vcEmail: string,
  founderName: string,
  founderCompany: string,
  introId: string,
) {
  const title = `${founderCompany} accepted your intro request!`;
  const message = `${founderName} from ${founderCompany} has accepted your introduction request. You can now start a conversation.`;

  await sendEmailNotification(
    vcEmail,
    title,
    `${message}\n\nView conversation: ${process.env.NEXT_PUBLIC_APP_URL}/vc/messages/${introId}`,
    `/vc/messages/${introId}`,
  );
}

