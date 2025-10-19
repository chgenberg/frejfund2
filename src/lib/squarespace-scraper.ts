/**
 * Squarespace-specific scraper
 * Detects and extracts data from Squarespace sites
 */

import { fetchHtml } from './web-scraper';
import * as cheerio from 'cheerio';

export interface SquarespaceProduct {
  name: string;
  price: string;
  description: string;
  url: string;
  imageUrl?: string;
}

export interface SquarespaceData {
  products: SquarespaceProduct[];
  pages: Array<{ title: string; content: string; url: string }>;
  totalProducts: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  siteInfo: {
    title?: string;
    description?: string;
    socialLinks?: string[];
  };
}

/**
 * Detect if a site is built on Squarespace
 */
export async function isSquarespaceSite(url: string): Promise<boolean> {
  try {
    const html = await fetchHtml(url, 5000);
    const $ = cheerio.load(html);

    // Squarespace indicators
    const indicators = [
      'script[src*="squarespace"]',
      'link[href*="squarespace"]',
      'meta[content*="Squarespace"]',
      '#siteWrapper',
      '.sqs-block',
      '.squarespace-',
      '[data-controller*="Squarespace"]',
    ];

    for (const indicator of indicators) {
      if ($(indicator).length > 0) {
        return true;
      }
    }

    // Check for Squarespace-specific patterns
    if (
      html.includes('squarespace.com') ||
      html.includes('Static.SQUARESPACE_CONTEXT') ||
      html.includes('sqsp.net')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Scrape Squarespace site
 */
export async function scrapeSquarespaceSite(
  startUrl: string,
  maxPages = 12,
  timeout = 8000,
): Promise<SquarespaceData> {
  const u = new URL(startUrl);
  const origin = u.origin;
  const visited = new Set<string>();
  const products: SquarespaceProduct[] = [];
  const pages: Array<{ title: string; content: string; url: string }> = [];
  const prices: number[] = [];
  const socialLinks = new Set<string>();
  let siteTitle = '';
  let siteDescription = '';
  let currency = 'USD';

  // Priority paths for Squarespace
  const priorityPaths = ['/', '/shop', '/store', '/products', '/about', '/contact', '/services'];

  const queue = priorityPaths.map((path) => `${origin}${path}`);

  for (const url of queue) {
    if (visited.size >= maxPages) break;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const html = await fetchHtml(url, timeout);
      const $ = cheerio.load(html);

      // Extract site title
      if (!siteTitle) {
        siteTitle =
          $('meta[property="og:site_name"]').attr('content') ||
          $('.site-title, .header-title-text').first().text().trim() ||
          $('title').text().split('—')[0].trim();
      }

      // Extract site description
      if (!siteDescription) {
        siteDescription =
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          '';
      }

      // Extract products (Squarespace commerce)
      $('.ProductList-item, .product-item, .sqs-block-product').each((_, el) => {
        const $el = $(el);
        const name = $el
          .find('.ProductList-title, .product-title, h1, h2, h3')
          .first()
          .text()
          .trim();
        const priceText = $el
          .find('.product-price, .ProductList-price, .sqs-money-native')
          .first()
          .text()
          .trim();
        const description = $el
          .find('.ProductList-description, .product-excerpt')
          .first()
          .text()
          .trim();
        const productUrl = $el.find('a').first().attr('href');
        const imageUrl = $el.find('img').first().attr('src');

        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? priceMatch[0] : '';

        if (name && products.length < 50) {
          products.push({
            name,
            price,
            description: description.slice(0, 200),
            url: productUrl ? new URL(productUrl, url).href : url,
            imageUrl,
          });

          const numPrice = parseFloat(price.replace(/,/g, ''));
          if (numPrice > 0) prices.push(numPrice);
        }
      });

      // Extract page content
      const pageTitle = $('h1').first().text().trim() || $('title').text();
      const pageContent = $('.sqs-block-content, .Main-content, article').first().text().trim();

      if (pageContent && pageContent.length > 100) {
        pages.push({
          title: pageTitle,
          content: pageContent.slice(0, 1000),
          url,
        });
      }

      // Detect currency
      const currencySymbol = $('.sqs-money-native')
        .first()
        .text()
        .match(/^[^\d\s]+/)?.[0];
      if (currencySymbol) {
        const currencyMap: Record<string, string> = {
          $: 'USD',
          '€': 'EUR',
          '£': 'GBP',
          kr: 'SEK',
          '¥': 'JPY',
        };
        currency = currencyMap[currencySymbol] || 'USD';
      }

      // Extract social links
      $(
        'a[href*="facebook.com"], a[href*="instagram.com"], a[href*="twitter.com"], a[href*="linkedin.com"]',
      ).each((_, el) => {
        const href = $(el).attr('href');
        if (href) socialLinks.add(href);
      });

      // Find more pages
      if (visited.size < maxPages) {
        $('nav a, .Header-nav a').each((_, el) => {
          const href = $(el).attr('href');
          if (href && !href.startsWith('#')) {
            try {
              const pageUrl = new URL(href, url).href;
              if (
                pageUrl.startsWith(origin) &&
                !visited.has(pageUrl) &&
                queue.length < maxPages * 2
              ) {
                queue.push(pageUrl);
              }
            } catch {}
          }
        });
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
  }

  return {
    products: products.slice(0, 30),
    pages: pages.slice(0, 10),
    totalProducts: products.length,
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      currency,
    },
    siteInfo: {
      title: siteTitle,
      description: siteDescription,
      socialLinks: Array.from(socialLinks),
    },
  };
}

/**
 * Convert Squarespace data to text for analysis
 */
export function squarespaceDataToContent(data: SquarespaceData): string {
  const sections = [];

  if (data.siteInfo.title) {
    sections.push(`SITE: ${data.siteInfo.title}`);
  }

  if (data.siteInfo.description) {
    sections.push(`\nDESCRIPTION:\n${data.siteInfo.description}`);
  }

  if (data.products.length > 0) {
    sections.push(`\nPRODUCTS/SERVICES (${data.totalProducts} total):`);
    sections.push(
      `Price range: ${data.priceRange.currency} ${data.priceRange.min}-${data.priceRange.max}`,
    );

    const productList = data.products
      .slice(0, 15)
      .map(
        (p) =>
          `- ${p.name}: ${data.priceRange.currency} ${p.price}${p.description ? ' - ' + p.description.slice(0, 100) : ''}`,
      );
    sections.push(productList.join('\n'));
  }

  if (data.pages.length > 0) {
    sections.push(`\nKEY PAGES:`);
    data.pages.forEach((page) => {
      if (page.content) {
        sections.push(`\n${page.title}:\n${page.content.slice(0, 300)}...`);
      }
    });
  }

  if (data.siteInfo.socialLinks && data.siteInfo.socialLinks.length > 0) {
    sections.push(`\nSOCIAL PRESENCE: ${data.siteInfo.socialLinks.length} channels`);
  }

  return sections.join('\n\n');
}
