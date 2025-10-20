/**
 * External Intelligence Gathering
 * Scrapes Wikipedia, Crunchbase, news, and other public sources
 */

import { fetchHtml } from './web-scraper';
import * as cheerio from 'cheerio';

export interface ExternalIntelligence {
  wikipedia?: {
    summary: string;
    founded?: string;
    headquarters?: string;
    revenue?: string;
    employees?: string;
    industry?: string;
  };
  crunchbase?: {
    description: string;
    totalFunding?: string;
    investors?: string[];
    lastRound?: string;
    founded?: string;
  };
  news?: Array<{
    title: string;
    source: string;
    date?: string;
    snippet: string;
  }>;
  combinedText: string;
  sources: string[];
}

/**
 * Scrape Wikipedia for company information
 */
async function scrapeWikipedia(companyName: string): Promise<ExternalIntelligence['wikipedia'] | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(companyName.replace(/\s+/g, '_'))}`;
    const html = await fetchHtml(searchUrl, 10000);
    if (!html) return null;

    const $ = cheerio.load(html);
    
    // Extract summary (first paragraph)
    const summary = $('.mw-parser-output > p').first().text().trim();
    
    // Extract infobox data
    const infobox: any = {};
    $('.infobox tr').each((_, row) => {
      const label = $(row).find('th').text().trim().toLowerCase();
      const value = $(row).find('td').text().trim();
      
      if (label.includes('founded')) infobox.founded = value;
      if (label.includes('headquarters')) infobox.headquarters = value;
      if (label.includes('revenue')) infobox.revenue = value;
      if (label.includes('employees') || label.includes('number of employees')) infobox.employees = value;
      if (label.includes('industry')) infobox.industry = value;
    });

    return {
      summary: summary.slice(0, 500),
      ...infobox,
    };
  } catch (error) {
    console.error('Wikipedia scraping failed:', error);
    return null;
  }
}

/**
 * Search for company news via Google News
 */
async function scrapeNews(companyName: string): Promise<ExternalIntelligence['news']> {
  try {
    // Use Google News search
    const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(companyName)}&hl=en`;
    const html = await fetchHtml(searchUrl, 8000);
    if (!html) return [];

    const $ = cheerio.load(html);
    const articles: ExternalIntelligence['news'] = [];
    
    $('article').slice(0, 5).each((_, article) => {
      const title = $(article).find('h3, h4').first().text().trim();
      const source = $(article).find('a[data-n-tid]').first().text().trim();
      const snippet = $(article).find('p').first().text().trim();
      
      if (title) {
        articles.push({ title, source, snippet: snippet.slice(0, 200) });
      }
    });

    return articles;
  } catch (error) {
    console.error('News scraping failed:', error);
    return [];
  }
}

/**
 * Attempt to scrape Crunchbase (limited without API key)
 */
async function scrapeCrunchbase(companyName: string): Promise<ExternalIntelligence['crunchbase'] | null> {
  try {
    // Try to find Crunchbase URL
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const url = `https://www.crunchbase.com/organization/${slug}`;
    
    const html = await fetchHtml(url, 10000);
    if (!html || html.includes('404') || html.includes('not found')) return null;

    const $ = cheerio.load(html);
    
    // Extract basic info (Crunchbase has heavy client-side rendering, so this is limited)
    const description = $('meta[property="og:description"]').attr('content')?.trim();
    
    return {
      description: description || 'Company profile available on Crunchbase',
    };
  } catch (error) {
    console.error('Crunchbase scraping failed:', error);
    return null;
  }
}

/**
 * Gather all external intelligence for a company
 */
export async function gatherExternalIntelligence(
  companyName: string,
  website?: string
): Promise<ExternalIntelligence> {
  console.log(`🌍 Gathering external intelligence for: ${companyName}`);
  
  const [wikipedia, news, crunchbase] = await Promise.all([
    scrapeWikipedia(companyName),
    scrapeNews(companyName),
    scrapeCrunchbase(companyName),
  ]);

  // Combine all text
  const textParts: string[] = [];
  const sources: string[] = [];

  if (wikipedia) {
    textParts.push(`WIKIPEDIA:\n${wikipedia.summary}`);
    if (wikipedia.founded) textParts.push(`Founded: ${wikipedia.founded}`);
    if (wikipedia.revenue) textParts.push(`Revenue: ${wikipedia.revenue}`);
    if (wikipedia.employees) textParts.push(`Employees: ${wikipedia.employees}`);
    sources.push(`https://en.wikipedia.org/wiki/${companyName.replace(/\s+/g, '_')}`);
  }

  if (crunchbase) {
    textParts.push(`\nCRUNCHBASE:\n${crunchbase.description}`);
    if (crunchbase.totalFunding) textParts.push(`Total Funding: ${crunchbase.totalFunding}`);
    if (crunchbase.investors) textParts.push(`Investors: ${crunchbase.investors.join(', ')}`);
    sources.push(`https://www.crunchbase.com/organization/${companyName.toLowerCase().replace(/\s+/g, '-')}`);
  }

  if (news && news.length > 0) {
    textParts.push(`\nRECENT NEWS:`);
    news.forEach(article => {
      textParts.push(`- ${article.title} (${article.source}): ${article.snippet}`);
    });
    sources.push('Google News');
  }

  return {
    wikipedia,
    crunchbase,
    news,
    combinedText: textParts.join('\n'),
    sources,
  };
}

/**
 * Detect company stage based on available data
 */
export function detectCompanyStage(businessInfo: any, scrapedContent: string): 'startup' | 'scaleup' | 'enterprise' {
  const content = (scrapedContent || '').toLowerCase();
  const name = (businessInfo.name || '').toLowerCase();
  
  // Enterprise signals
  const enterpriseSignals = [
    content.includes('annual report'),
    content.includes('fiscal year'),
    content.includes('sec filing'),
    content.includes('investor relations'),
    content.includes('billion') || content.includes('million employees'),
    /\b\d{3,}\s*million\b/.test(content), // "500 million" revenue
    name.includes('inc.') || name.includes('corp') || name.includes('plc'),
  ];
  
  const enterpriseScore = enterpriseSignals.filter(Boolean).length;
  
  // Scaleup signals
  const scaleupSignals = [
    content.includes('series b') || content.includes('series c'),
    content.includes('expanded to') || content.includes('offices in'),
    /\b\d{2,3}\s*employees\b/.test(content), // "50 employees"
    businessInfo.stage?.toLowerCase().includes('growth'),
  ];
  
  const scaleupScore = scaleupSignals.filter(Boolean).length;
  
  if (enterpriseScore >= 3) return 'enterprise';
  if (scaleupScore >= 2) return 'scaleup';
  return 'startup';
}

/**
 * Get dimensions that are N/A for enterprise companies
 */
export function getEnterprisNADimensions(): string[] {
  return [
    'product-market-fit', // Already established
    'founder-market-fit', // Institutional management
    'mvp-quality', // Long past MVP
    'early-traction', // Mature company
    'first-customers', // Established customer base
    'funding-stage-appropriate', // Different funding dynamics
    'pre-seed-readiness', // N/A
    'seed-readiness', // N/A
  ];
}

