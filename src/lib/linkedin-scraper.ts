/**
 * LinkedIn Company Scraper
 * Scrapes public LinkedIn company pages for business intelligence
 * Server-side only
 */

// Ensure this only runs on server
if (typeof window !== 'undefined') {
  throw new Error('linkedin-scraper must only be used server-side');
}

export interface LinkedInCompanyData {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  employeeCount?: number;
  headquarters?: string;
  founded?: number;
  specialties?: string[];
  followers?: number;

  // Team intelligence
  recentHires?: Array<{
    name: string;
    title: string;
    startDate?: string;
  }>;

  keyPeople?: Array<{
    name: string;
    title: string;
    profile?: string;
  }>;

  // Company updates
  recentPosts?: Array<{
    text: string;
    date?: string;
    engagement?: number;
  }>;

  // Growth signals
  growthRate?: string; // e.g., "Growing (hired 5 people in last 3 months)"
  openPositions?: number;

  // Metadata
  linkedInUrl: string;
  scrapedAt: Date;
}

/**
 * Scrape LinkedIn company page
 * Note: This uses public data only, no authentication required
 */
export async function scrapeLinkedInCompany(
  companyUrl: string,
): Promise<LinkedInCompanyData | null> {
  try {
    // Ensure it's a LinkedIn URL
    if (!companyUrl.includes('linkedin.com/company/')) {
      // Try to construct one
      const companyName = companyUrl.replace(/^https?:\/\//, '').split('/')[0];
      companyUrl = `https://www.linkedin.com/company/${companyName}`;
    }

    // Use a headless browser service or proxy
    // For now, we'll use a simple fetch with proper headers
    const response = await fetch(companyUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      // Avoid CORS issues in development
      ...(process.env.NODE_ENV === 'development' && { mode: 'no-cors' as RequestMode }),
    });

    if (!response.ok) {
      console.error('LinkedIn scrape failed:', response.status);
      return null;
    }

    const html = await response.text();

    // Parse HTML (basic regex parsing - in production, use Cheerio or similar)
    const data: LinkedInCompanyData = {
      name: extractText(html, /<h1[^>]*>(.*?)<\/h1>/i) || 'Unknown Company',
      description: extractText(
        html,
        /<p class="[^"]*org-top-card-summary__tagline[^"]*"[^>]*>(.*?)<\/p>/i,
      ),
      website: extractText(html, /<a[^>]*href="([^"]*)"[^>]*>Website<\/a>/i),
      industry: extractText(html, /<div[^>]*>Industry<\/div>\s*<div[^>]*>(.*?)<\/div>/i),
      companySize: extractText(html, /<div[^>]*>Company size<\/div>\s*<div[^>]*>(.*?)<\/div>/i),
      headquarters: extractText(html, /<div[^>]*>Headquarters<\/div>\s*<div[^>]*>(.*?)<\/div>/i),
      specialties: extractSpecialties(html),
      followers: extractNumber(html, /(\d+(?:,\d+)*)\s*followers/i),
      linkedInUrl: companyUrl,
      scrapedAt: new Date(),
    };

    // Parse employee count from company size string
    if (data.companySize) {
      const match = data.companySize.match(/(\d+(?:,\d+)?)\s*-\s*(\d+(?:,\d+)?)/);
      if (match) {
        const avg =
          (parseInt(match[1].replace(/,/g, '')) + parseInt(match[2].replace(/,/g, ''))) / 2;
        data.employeeCount = Math.round(avg);
      }
    }

    return data;
  } catch (error) {
    console.error('LinkedIn scraping error:', error);
    return null;
  }
}

/**
 * Alternative: Use RapidAPI LinkedIn scraper
 * More reliable but costs ~$0.01 per request
 */
export async function scrapeLinkedInViaAPI(
  companyUrl: string,
): Promise<LinkedInCompanyData | null> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not set, falling back to direct scraping');
    return scrapeLinkedInCompany(companyUrl);
  }

  try {
    const response = await fetch('https://linkedin-api8.p.rapidapi.com/get-company-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'linkedin-api8.p.rapidapi.com',
      },
      body: JSON.stringify({
        url: companyUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Transform API response to our format
    return {
      name: data.name || 'Unknown Company',
      description: data.description,
      website: data.website,
      industry: data.industry,
      companySize: data.companySize,
      employeeCount: data.staffCount,
      headquarters: data.headquarters,
      founded: data.foundedYear,
      specialties: data.specialties || [],
      followers: data.followerCount,
      linkedInUrl: companyUrl,
      scrapedAt: new Date(),
    };
  } catch (error) {
    console.error('LinkedIn API error:', error);
    return null;
  }
}

/**
 * Extract key people from LinkedIn company page
 * This requires more advanced scraping or API access
 */
export async function getLinkedInKeyPeople(
  companyUrl: string,
): Promise<Array<{ name: string; title: string; profile?: string }>> {
  // This would require navigating to /people page
  // For now, return empty array
  // In production, use Puppeteer or LinkedIn API
  return [];
}

/**
 * Analyze hiring velocity from LinkedIn
 */
export async function analyzeHiringVelocity(companyUrl: string): Promise<{
  recentHires: number;
  openPositions: number;
  growthSignal: 'rapid' | 'steady' | 'slow' | 'unknown';
}> {
  try {
    // Scrape /jobs page
    const jobsUrl = companyUrl.replace('/about/', '/jobs/').replace(/\/$/, '') + '/jobs/';

    const response = await fetch(jobsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text();
      const openPositions = (html.match(/job-posting/g) || []).length;

      let growthSignal: 'rapid' | 'steady' | 'slow' | 'unknown' = 'unknown';
      if (openPositions > 10) growthSignal = 'rapid';
      else if (openPositions > 3) growthSignal = 'steady';
      else if (openPositions > 0) growthSignal = 'slow';

      return {
        recentHires: 0, // Would need people page access
        openPositions,
        growthSignal,
      };
    }
  } catch (error) {
    console.error('Hiring velocity analysis error:', error);
  }

  return {
    recentHires: 0,
    openPositions: 0,
    growthSignal: 'unknown',
  };
}

// Helper functions
function extractText(html: string, regex: RegExp): string | undefined {
  const match = html.match(regex);
  if (match && match[1]) {
    return match[1].replace(/<[^>]*>/g, '').trim();
  }
  return undefined;
}

function extractNumber(html: string, regex: RegExp): number | undefined {
  const match = html.match(regex);
  if (match && match[1]) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return undefined;
}

function extractSpecialties(html: string): string[] | undefined {
  const match = html.match(/Specialties<\/div>\s*<div[^>]*>(.*?)<\/div>/i);
  if (match && match[1]) {
    return match[1].split(',').map((s) => s.trim());
  }
  return undefined;
}
