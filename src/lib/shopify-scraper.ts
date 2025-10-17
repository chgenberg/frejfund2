/**
 * Shopify-specific scraper with enhanced e-commerce data extraction
 * Prioritizes product, pricing, and business information
 */

import { fetchHtml, extractWithCheerio } from './web-scraper';
import * as cheerio from 'cheerio';

export interface ShopifyScrapingResult {
  products: Array<{
    name: string;
    price: string;
    description: string;
    url: string;
  }>;
  collections: string[];
  aboutContent: string;
  policies: {
    shipping?: string;
    returns?: string;
    privacy?: string;
  };
  businessInfo: {
    brandStory?: string;
    location?: string;
    socialLinks?: string[];
  };
  totalProducts: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

// Shopify-specific URL patterns in priority order
const SHOPIFY_PRIORITY_PATHS = [
  '/', // Homepage - highest priority
  '/pages/about-us',
  '/pages/about',
  '/pages/our-story',
  '/collections/all',
  '/collections/frontpage',
  '/products', // Product catalog
  '/pages/contact',
  '/pages/faq',
  '/blogs/news',
  '/pages/shipping-policy',
  '/pages/refund-policy',
  '/pages/privacy-policy',
  '/pages/terms-of-service'
];

// Detect if it's a Shopify site
export async function isShopifySite(url: string): Promise<boolean> {
  try {
    const html = await fetchHtml(url, 5000);
    const $ = cheerio.load(html);
    
    // Check for Shopify indicators
    const shopifyIndicators = [
      'script[src*="cdn.shopify.com"]',
      'link[href*="cdn.shopify.com"]',
      'meta[name="shopify-digital-wallet"]',
      'meta[name="shopify-checkout-api-token"]',
      '#shopify-features',
      '.shopify-section',
      'form[action*="/cart/add"]'
    ];
    
    for (const indicator of shopifyIndicators) {
      if ($(indicator).length > 0) {
        return true;
      }
    }
    
    // Check response headers (if available in the future)
    // Look for X-ShopId header
    
    return false;
  } catch {
    return false;
  }
}

// Scrape a Shopify site with priority patterns
export async function scrapeShopifySite(
  startUrl: string, 
  maxPages = 12,
  timeout = 8000
): Promise<ShopifyScrapingResult> {
  const u = new URL(startUrl);
  const origin = u.origin;
  const visited = new Set<string>();
  const products: ShopifyScrapingResult['products'] = [];
  const collections = new Set<string>();
  const prices: number[] = [];
  let aboutContent = '';
  let brandStory = '';
  const policies: ShopifyScrapingResult['policies'] = {};
  const socialLinks = new Set<string>();
  let location = '';
  let currency = 'USD';

  // Build priority queue
  const priorityQueue: string[] = SHOPIFY_PRIORITY_PATHS.map(path => `${origin}${path}`);
  
  // Also try to fetch products.json (Shopify API)
  try {
    const productsJson = await fetch(`${origin}/products.json`).then(r => r.json());
    if (productsJson.products) {
      productsJson.products.slice(0, 20).forEach((p: any) => {
        products.push({
          name: p.title,
          price: p.variants?.[0]?.price || '',
          description: p.body_html?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
          url: `${origin}/products/${p.handle}`
        });
        const price = parseFloat(p.variants?.[0]?.price || '0');
        if (price > 0) prices.push(price);
      });
    }
  } catch {}

  // Scrape priority pages
  for (const url of priorityQueue) {
    if (visited.size >= maxPages) break;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const html = await fetchHtml(url, timeout);
      const $ = cheerio.load(html);

      // Extract products
      $('.product-item, .grid-product, .product-card, article[data-product-id]').each((_, el) => {
        const $el = $(el);
        const name = $el.find('.product-title, .product-name, h3, h2').first().text().trim() ||
                    $el.find('a[href*="/products/"]').first().text().trim();
        const priceText = $el.find('.price, .product-price, [class*="price"]').first().text().trim();
        const price = priceText.match(/[\d,]+\.?\d*/)?.[0] || '';
        const link = $el.find('a[href*="/products/"]').first().attr('href');
        const productUrl = link ? new URL(link, url).href : '';

        if (name && products.length < 50) {
          products.push({
            name,
            price,
            description: $el.find('.product-description, .product-excerpt').first().text().slice(0, 200) || '',
            url: productUrl
          });
          const numPrice = parseFloat(price.replace(/,/g, ''));
          if (numPrice > 0) prices.push(numPrice);
        }
      });

      // Extract collections
      $('a[href*="/collections/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.includes('/collections/all')) {
          const collection = href.split('/collections/')[1]?.split('/')[0];
          if (collection) collections.add(collection.replace(/-/g, ' '));
        }
      });

      // Extract about content
      if (url.includes('/about') || url.includes('/our-story')) {
        const mainContent = $('.page-content, .rte, main, article').first().text().trim();
        if (mainContent.length > aboutContent.length) {
          aboutContent = mainContent.slice(0, 2000);
        }
        
        // Look for brand story
        const storySection = $('*:contains("our story"), *:contains("brand story"), *:contains("founded")').closest('section, div').text();
        if (storySection && storySection.length > 100) {
          brandStory = storySection.slice(0, 1000);
        }
      }

      // Extract policies
      if (url.includes('shipping')) {
        policies.shipping = $('.page-content, .rte, main').first().text().slice(0, 500);
      }
      if (url.includes('return') || url.includes('refund')) {
        policies.returns = $('.page-content, .rte, main').first().text().slice(0, 500);
      }
      if (url.includes('privacy')) {
        policies.privacy = $('.page-content, .rte, main').first().text().slice(0, 500);
      }

      // Extract location
      const locationPatterns = [
        /(?:located in|based in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
        /([A-Z][a-z]+(?:,\s*[A-Z]{2})?)\s*(?:\d{5})?$/m // City, State pattern
      ];
      for (const pattern of locationPatterns) {
        const match = $('body').text().match(pattern);
        if (match?.[1]) {
          location = match[1];
          break;
        }
      }

      // Extract social links
      $('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="twitter.com"], a[href*="pinterest.com"], a[href*="youtube.com"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) socialLinks.add(href);
      });

      // Detect currency
      const currencyMatch = $('body').text().match(/([A-Z]{3})\s*\$|£|€|¥|₹/);
      if (currencyMatch) {
        currency = currencyMatch[1] || 'USD';
      }

      // Find more product pages
      if (visited.size < maxPages) {
        $('a[href*="/products/"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href) {
            try {
              const productUrl = new URL(href, url).href;
              if (!visited.has(productUrl) && priorityQueue.length < maxPages * 2) {
                priorityQueue.push(productUrl);
              }
            } catch {}
          }
        });
      }

    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }
  }

  // Calculate price range
  const priceRange = {
    min: prices.length > 0 ? Math.min(...prices) : 0,
    max: prices.length > 0 ? Math.max(...prices) : 0,
    currency
  };

  return {
    products: products.slice(0, 30), // Top 30 products
    collections: Array.from(collections).slice(0, 10),
    aboutContent,
    policies,
    businessInfo: {
      brandStory: brandStory || aboutContent.slice(0, 500),
      location,
      socialLinks: Array.from(socialLinks)
    },
    totalProducts: products.length,
    priceRange
  };
}

// Convert Shopify data to enriched content for analysis
export function shopifyDataToContent(data: ShopifyScrapingResult): string {
  const sections = [];

  // Business overview
  if (data.businessInfo.brandStory) {
    sections.push(`ABOUT THE BUSINESS:\n${data.businessInfo.brandStory}`);
  }

  if (data.businessInfo.location) {
    sections.push(`LOCATION: ${data.businessInfo.location}`);
  }

  // Product information
  if (data.products.length > 0) {
    sections.push(`\nPRODUCTS (${data.totalProducts} total):`);
    sections.push(`Price range: ${data.priceRange.currency} ${data.priceRange.min}-${data.priceRange.max}`);
    
    const productList = data.products.slice(0, 10).map(p => 
      `- ${p.name}: ${data.priceRange.currency} ${p.price}${p.description ? ' - ' + p.description.slice(0, 100) : ''}`
    );
    sections.push(productList.join('\n'));
  }

  // Collections/Categories
  if (data.collections.length > 0) {
    sections.push(`\nPRODUCT CATEGORIES: ${data.collections.join(', ')}`);
  }

  // Policies (important for business model understanding)
  if (data.policies.shipping) {
    sections.push(`\nSHIPPING POLICY: ${data.policies.shipping.slice(0, 200)}...`);
  }

  if (data.policies.returns) {
    sections.push(`\nRETURN POLICY: ${data.policies.returns.slice(0, 200)}...`);
  }

  // Social proof
  if (data.businessInfo.socialLinks?.length > 0) {
    sections.push(`\nSOCIAL MEDIA PRESENCE: ${data.businessInfo.socialLinks.length} channels`);
  }

  return sections.join('\n\n');
}
