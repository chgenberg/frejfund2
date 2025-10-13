/**
 * Enhanced Scraper Orchestrator
 * Combines web scraping, LinkedIn, GitHub, and Product Hunt data
 */

import { scrapeWebsite } from './web-scraper';
import { scrapeLinkedInCompany, analyzeHiringVelocity, type LinkedInCompanyData } from './linkedin-scraper';
import { analyzeGitHubOrg, type GitHubOrgData } from './github-analyzer';
import { scrapeProductHunt, searchProductHunt, type ProductHuntData } from './producthunt-scraper';
import { BusinessInfo } from '@/types/business';

export interface EnhancedScrapingResult {
  // Original web scraping
  websiteContent: string;
  websiteSources: string[];
  
  // LinkedIn intelligence
  linkedInData?: LinkedInCompanyData;
  hiringVelocity?: {
    openPositions: number;
    growthSignal: string;
  };
  
  // GitHub intelligence
  githubData?: GitHubOrgData;
  
  // Product Hunt intelligence
  productHuntData?: ProductHuntData[];
  
  // Summary stats
  totalDataPoints: number;
  scrapingDuration: number; // ms
  dataSources: string[];
}

/**
 * Run enhanced scraping with all available data sources
 */
export async function runEnhancedScraping(
  businessInfo: BusinessInfo
): Promise<EnhancedScrapingResult> {
  const startTime = Date.now();
  const dataSources: string[] = ['website'];
  
  console.log('🚀 Starting enhanced scraping for:', businessInfo.name);

  // 1. Website scraping (always run)
  const websiteData = await scrapeWebsite(businessInfo.website || '');
  
  const result: EnhancedScrapingResult = {
    websiteContent: websiteData.text,
    websiteSources: websiteData.sources,
    totalDataPoints: 1,
    scrapingDuration: 0,
    dataSources
  };

  // 2. LinkedIn scraping (if LinkedIn URL provided)
  if (businessInfo.linkedinUrl) {
    console.log('🔍 Scraping LinkedIn...');
    try {
      const linkedInData = await scrapeLinkedInCompany(businessInfo.linkedinUrl);
      if (linkedInData) {
        result.linkedInData = linkedInData;
        result.totalDataPoints++;
        dataSources.push('linkedin');
        
        // Also analyze hiring velocity
        const hiring = await analyzeHiringVelocity(businessInfo.linkedinUrl);
        result.hiringVelocity = {
          openPositions: hiring.openPositions,
          growthSignal: hiring.growthSignal
        };
      }
    } catch (error) {
      console.error('LinkedIn scraping failed:', error);
    }
  }

  // 3. GitHub analysis (if we can find their org)
  const githubOrgName = await findGitHubOrg(businessInfo);
  if (githubOrgName) {
    console.log('💻 Analyzing GitHub org:', githubOrgName);
    try {
      const githubData = await analyzeGitHubOrg(githubOrgName);
      if (githubData) {
        result.githubData = githubData;
        result.totalDataPoints++;
        dataSources.push('github');
      }
    } catch (error) {
      console.error('GitHub analysis failed:', error);
    }
  }

  // 4. Product Hunt scraping
  console.log('🚀 Searching Product Hunt...');
  try {
    const phData = await searchProductHunt(businessInfo.name || '');
    if (phData && phData.length > 0) {
      result.productHuntData = phData;
      result.totalDataPoints++;
      dataSources.push('producthunt');
    }
  } catch (error) {
    console.error('Product Hunt scraping failed:', error);
  }

  result.scrapingDuration = Date.now() - startTime;
  result.dataSources = dataSources;

  console.log(`✅ Enhanced scraping complete! ${result.totalDataPoints} data sources in ${result.scrapingDuration}ms`);

  return result;
}

/**
 * Find GitHub organization name from business info
 */
async function findGitHubOrg(businessInfo: BusinessInfo): Promise<string | null> {
  // 1. Check if GitHub URL is in website or LinkedIn
  if (businessInfo.website) {
    try {
      const response = await fetch(businessInfo.website);
      const html = await response.text();
      
      // Look for GitHub links
      const githubMatch = html.match(/github\.com\/([^\/"\s]+)/i);
      if (githubMatch && githubMatch[1]) {
        const orgName = githubMatch[1];
        // Verify it's not a personal profile
        if (!['login', 'signup', 'pricing', 'features'].includes(orgName.toLowerCase())) {
          return orgName;
        }
      }
    } catch (error) {
      // Website scraping failed, continue
    }
  }

  // 2. Try common patterns
  const companyName = businessInfo.name?.toLowerCase().replace(/\s+/g, '-') || '';
  const possibleOrgs = [
    companyName,
    companyName + '-io',
    companyName + 'hq',
    companyName.replace(/-/g, '')
  ];

  // Verify which one exists
  for (const org of possibleOrgs) {
    try {
      const response = await fetch(`https://api.github.com/orgs/${org}`, {
        headers: {
          'User-Agent': 'FrejFund-Analyzer'
        }
      });
      if (response.ok) {
        return org;
      }
    } catch (error) {
      // Continue trying
    }
  }

  return null;
}

/**
 * Generate enriched content summary for GPT analysis
 */
export function generateEnrichedSummary(
  scrapingResult: EnhancedScrapingResult,
  businessInfo: BusinessInfo
): string {
  let summary = `# Enhanced Company Intelligence Report\n\n`;
  summary += `Company: ${businessInfo.name}\n`;
  summary += `Industry: ${businessInfo.industry}\n`;
  summary += `Stage: ${businessInfo.stage}\n`;
  summary += `Data Sources: ${scrapingResult.dataSources.join(', ')}\n\n`;

  // Website content
  summary += `## Website Content\n${scrapingResult.websiteContent.slice(0, 3000)}\n\n`;

  // LinkedIn intelligence
  if (scrapingResult.linkedInData) {
    const ld = scrapingResult.linkedInData;
    summary += `## LinkedIn Intelligence\n`;
    summary += `- Company Size: ${ld.companySize || 'Unknown'}\n`;
    summary += `- Employee Count: ${ld.employeeCount || 'Unknown'}\n`;
    summary += `- Industry: ${ld.industry || 'Unknown'}\n`;
    summary += `- Founded: ${ld.founded || 'Unknown'}\n`;
    summary += `- Followers: ${ld.followers || 'Unknown'}\n`;
    if (ld.specialties && ld.specialties.length > 0) {
      summary += `- Specialties: ${ld.specialties.join(', ')}\n`;
    }
    summary += `\n`;
  }

  // Hiring velocity
  if (scrapingResult.hiringVelocity) {
    summary += `## Hiring Velocity\n`;
    summary += `- Open Positions: ${scrapingResult.hiringVelocity.openPositions}\n`;
    summary += `- Growth Signal: ${scrapingResult.hiringVelocity.growthSignal}\n`;
    summary += `\n`;
  }

  // GitHub intelligence
  if (scrapingResult.githubData) {
    const gh = scrapingResult.githubData;
    summary += `## GitHub Technical Intelligence\n`;
    summary += `- Public Repos: ${gh.publicRepos}\n`;
    summary += `- Total Stars: ${gh.totalStars}\n`;
    summary += `- Development Velocity: ${gh.developmentVelocity}\n`;
    summary += `- Code Quality: ${gh.codeQuality}\n`;
    summary += `- Commits (7d): ${gh.commitActivity.last7Days}\n`;
    summary += `- Commits (30d): ${gh.commitActivity.last30Days}\n`;
    summary += `- Primary Languages: ${gh.languages.map(l => `${l.name} (${l.percentage}%)`).join(', ')}\n`;
    summary += `- Has Tests: ${gh.hasTests ? 'Yes' : 'No'}\n`;
    summary += `- Has CI/CD: ${gh.hasCI ? 'Yes' : 'No'}\n`;
    summary += `- Open Issues: ${gh.openIssues}\n`;
    if (gh.recentReleases.length > 0) {
      summary += `- Latest Release: ${gh.recentReleases[0].name} (${gh.recentReleases[0].date})\n`;
    }
    summary += `\n`;
  }

  // Product Hunt intelligence
  if (scrapingResult.productHuntData && scrapingResult.productHuntData.length > 0) {
    const ph = scrapingResult.productHuntData[0];
    summary += `## Product Hunt Community Traction\n`;
    summary += `- Product: ${ph.productName}\n`;
    summary += `- Tagline: ${ph.tagline || 'N/A'}\n`;
    summary += `- Total Upvotes: ${ph.totalUpvotes}\n`;
    summary += `- Total Comments: ${ph.totalComments}\n`;
    summary += `- Community Interest: ${ph.communityInterest}\n`;
    summary += `- Featured: ${ph.wasFeatured ? 'Yes' : 'No'}\n`;
    if (ph.bestRank) {
      summary += `- Best Daily Rank: #${ph.bestRank}\n`;
    }
    summary += `\n`;
  }

  return summary;
}

/**
 * Helper: Extract multiple matches
 */
function extractAllMatches(html: string, regex: RegExp): string[] {
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)];
}

/**
 * Helper: Extract text from HTML
 */
function extractText(html: string, regex: RegExp): string | undefined {
  const match = html.match(regex);
  return match?.[1]?.replace(/<[^>]*>/g, '').trim();
}

/**
 * Helper: Extract number from HTML
 */
function extractNumber(html: string, regex: RegExp): number | undefined {
  const match = html.match(regex);
  if (match && match[1]) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return undefined;
}

