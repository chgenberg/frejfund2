/**
 * Google Custom Search API integration
 * - Rate limited per user and globally
 * - Cached results to minimize API calls
 * - Smart query optimization
 */

import { prisma } from './prisma';

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
  };
}

interface CachedSearch {
  query: string;
  results: GoogleSearchResult[];
  timestamp: number;
}

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GLOBAL_DAILY_LIMIT = 80; // Save 20 for emergency
const USER_DAILY_LIMIT = 5; // Max searches per user per day
const USER_MONTHLY_LIMIT = 20; // Max searches per user per month

/**
 * Check if user has exceeded search quota
 */
async function checkUserQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Count today's searches
  const dailyCount = await prisma.googleSearchLog.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });

  // Count this month's searches
  const monthlyCount = await prisma.googleSearchLog.count({
    where: {
      userId,
      createdAt: { gte: monthStart },
    },
  });

  const dailyRemaining = USER_DAILY_LIMIT - dailyCount;
  const monthlyRemaining = USER_MONTHLY_LIMIT - monthlyCount;

  return {
    allowed: dailyCount < USER_DAILY_LIMIT && monthlyCount < USER_MONTHLY_LIMIT,
    remaining: Math.min(dailyRemaining, monthlyRemaining),
  };
}

/**
 * Check global daily quota
 */
async function checkGlobalQuota(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const globalCount = await prisma.googleSearchLog.count({
    where: {
      createdAt: { gte: today },
    },
  });

  return globalCount < GLOBAL_DAILY_LIMIT;
}

/**
 * Log a search for quota tracking
 */
async function logSearch(userId: string, query: string, resultCount: number, cached: boolean) {
  await prisma.googleSearchLog.create({
    data: {
      userId,
      query,
      resultCount,
      cached,
    },
  });
}

/**
 * Get cached search results if available
 */
function getCachedResults(query: string): GoogleSearchResult[] | null {
  if (typeof window === 'undefined') return null; // Server-side only uses DB cache

  try {
    const cacheKey = `google-search:${query.toLowerCase().trim()}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const parsed: CachedSearch = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age > CACHE_DURATION_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.results;
  } catch {
    return null;
  }
}

/**
 * Cache search results
 */
function cacheResults(query: string, results: GoogleSearchResult[]) {
  if (typeof window === 'undefined') return;

  try {
    const cacheKey = `google-search:${query.toLowerCase().trim()}`;
    const cache: CachedSearch = {
      query,
      results,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache search results:', error);
  }
}

/**
 * Perform Google Custom Search
 */
export async function googleSearch(
  query: string,
  userId: string,
  options?: {
    maxResults?: number;
    dateRestrict?: string; // e.g., 'd7' for last 7 days, 'm1' for last month
    exactTerms?: string;
  }
): Promise<{
  results: GoogleSearchResult[];
  cached: boolean;
  quotaRemaining: number;
  error?: string;
}> {
  const maxResults = options?.maxResults || 5;

  // Check cache first
  const cached = getCachedResults(query);
  if (cached) {
    const quota = await checkUserQuota(userId);
    return {
      results: cached.slice(0, maxResults),
      cached: true,
      quotaRemaining: quota.remaining,
    };
  }

  // Check user quota
  const userQuota = await checkUserQuota(userId);
  if (!userQuota.allowed) {
    return {
      results: [],
      cached: false,
      quotaRemaining: 0,
      error: 'Daily or monthly search limit exceeded',
    };
  }

  // Check global quota
  const globalAllowed = await checkGlobalQuota();
  if (!globalAllowed) {
    return {
      results: [],
      cached: false,
      quotaRemaining: userQuota.remaining,
      error: 'Global daily search limit reached',
    };
  }

  // Check API keys
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn('Google Search API not configured');
    return {
      results: [],
      cached: false,
      quotaRemaining: userQuota.remaining,
      error: 'Search API not configured',
    };
  }

  try {
    // Build query params
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: Math.min(maxResults, 10).toString(), // Max 10 per request
    });

    if (options?.dateRestrict) {
      params.append('dateRestrict', options.dateRestrict);
    }

    if (options?.exactTerms) {
      params.append('exactTerms', options.exactTerms);
    }

    // Make API request
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data: GoogleSearchResponse = await response.json();
    const results = data.items || [];

    // Cache results
    cacheResults(query, results);

    // Log search
    await logSearch(userId, query, results.length, false);

    return {
      results: results.slice(0, maxResults),
      cached: false,
      quotaRemaining: userQuota.remaining - 1,
    };
  } catch (error) {
    console.error('Google Search API error:', error);
    return {
      results: [],
      cached: false,
      quotaRemaining: userQuota.remaining,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Smart company intelligence search
 * Combines multiple strategic searches about a company
 */
export async function searchCompanyIntelligence(
  companyName: string,
  industry: string,
  userId: string
): Promise<{
  news: GoogleSearchResult[];
  competitors: GoogleSearchResult[];
  marketTrends: GoogleSearchResult[];
  quotaRemaining: number;
}> {
  const results = {
    news: [] as GoogleSearchResult[],
    competitors: [] as GoogleSearchResult[],
    marketTrends: [] as GoogleSearchResult[],
    quotaRemaining: 0,
  };

  // 1. Recent news about company (last 30 days)
  const newsSearch = await googleSearch(
    `"${companyName}" (news OR press OR launch OR funding)`,
    userId,
    {
      maxResults: 3,
      dateRestrict: 'm1', // Last month
    }
  );
  results.news = newsSearch.results;
  results.quotaRemaining = newsSearch.quotaRemaining;

  // Stop if quota exhausted
  if (results.quotaRemaining <= 0) {
    return results;
  }

  // 2. Competitors in the space
  const competitorSearch = await googleSearch(
    `${industry} startups alternatives "${companyName}"`,
    userId,
    {
      maxResults: 3,
    }
  );
  results.competitors = competitorSearch.results;
  results.quotaRemaining = competitorSearch.quotaRemaining;

  // Stop if quota exhausted
  if (results.quotaRemaining <= 0) {
    return results;
  }

  // 3. Market trends (only if user has quota left)
  const trendsSearch = await googleSearch(`${industry} market trends ${new Date().getFullYear()}`, userId, {
    maxResults: 2,
  });
  results.marketTrends = trendsSearch.results;
  results.quotaRemaining = trendsSearch.quotaRemaining;

  return results;
}

/**
 * Get user's remaining search quota
 */
export async function getUserSearchQuota(userId: string): Promise<{
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyLimit: number;
  monthlyLimit: number;
}> {
  const quota = await checkUserQuota(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const dailyCount = await prisma.googleSearchLog.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });

  const monthlyCount = await prisma.googleSearchLog.count({
    where: {
      userId,
      createdAt: { gte: monthStart },
    },
  });

  return {
    dailyRemaining: USER_DAILY_LIMIT - dailyCount,
    monthlyRemaining: USER_MONTHLY_LIMIT - monthlyCount,
    dailyLimit: USER_DAILY_LIMIT,
    monthlyLimit: USER_MONTHLY_LIMIT,
  };
}

