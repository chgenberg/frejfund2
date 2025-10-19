/**
 * Subscription utilities
 * Handle tier checking and feature gating
 */

import { prisma } from './prisma';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface TierFeatures {
  maxDimensions: number;
  maxAnalysesPerMonth: number;
  gapQA: boolean;
  prioritySupport: boolean;
  customReports: boolean;
  apiAccess: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    maxDimensions: 30,
    maxAnalysesPerMonth: 3,
    gapQA: false,
    prioritySupport: false,
    customReports: false,
    apiAccess: false,
  },
  pro: {
    maxDimensions: 95,
    maxAnalysesPerMonth: 20,
    gapQA: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: false,
  },
  enterprise: {
    maxDimensions: 95,
    maxAnalysesPerMonth: -1, // unlimited
    gapQA: true,
    prioritySupport: true,
    customReports: true,
    apiAccess: true,
  },
};

/**
 * Get user's subscription tier
 * TEMPORARY: Always return 'pro' for testing (Stripe integration disabled)
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  // For testing: Everyone gets Pro features
  return 'pro';

  /* Uncomment when Stripe is ready:
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionStatus: true, currentPeriodEnd: true }
  });

  if (!user) return 'free';

  // Check if subscription is active and not expired
  if (user.subscriptionStatus === 'active' && user.currentPeriodEnd) {
    if (new Date(user.currentPeriodEnd) > new Date()) {
      return user.subscriptionTier as SubscriptionTier;
    }
  }

  return 'free';
  */
}

/**
 * Get user's subscription tier from session
 * TEMPORARY: Always return 'pro' for testing
 */
export async function getUserTierFromSession(sessionId: string): Promise<SubscriptionTier> {
  // For testing: Everyone gets Pro features
  return 'pro';

  /* Uncomment when Stripe is ready:
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true }
  });

  if (!session || !session.userId) return 'free';

  return getUserTier(session.userId);
  */
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof TierFeatures,
): Promise<boolean> {
  const tier = await getUserTier(userId);
  return TIER_FEATURES[tier][feature] as boolean;
}

/**
 * Check if user can run another analysis this month
 * TEMPORARY: Always allow for testing
 */
export async function canRunAnalysis(
  userId: string,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // For testing: Unlimited analyses
  return { allowed: true, remaining: -1, limit: -1 };

  /* Uncomment when Stripe is ready:
  const tier = await getUserTier(userId);
  const features = TIER_FEATURES[tier];
  
  // Enterprise has unlimited
  if (features.maxAnalysesPerMonth === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  // Count analyses this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const analysesThisMonth = await prisma.deepAnalysis.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth }
    }
  });

  const remaining = Math.max(0, features.maxAnalysesPerMonth - analysesThisMonth);
  const allowed = analysesThisMonth < features.maxAnalysesPerMonth;

  return { allowed, remaining, limit: features.maxAnalysesPerMonth };
  */
}

/**
 * Get number of dimensions user can analyze
 */
export async function getMaxDimensions(userId: string): Promise<number> {
  const tier = await getUserTier(userId);
  return TIER_FEATURES[tier].maxDimensions;
}

/**
 * Check if user needs to upgrade for a feature
 */
export function needsUpgrade(
  currentTier: SubscriptionTier,
  requiredFeature: keyof TierFeatures,
): boolean {
  return !TIER_FEATURES[currentTier][requiredFeature];
}

/**
 * Get upgrade CTA message
 */
export function getUpgradeMessage(feature: string): string {
  return `Upgrade to Pro to unlock ${feature} and get deeper insights into your business.`;
}
