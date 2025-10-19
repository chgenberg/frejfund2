/**
 * WooCommerce-specific scraper
 * Detects and extracts e-commerce data from WooCommerce stores
 */

import { fetchHtml, extractWithCheerio } from './web-scraper';
import * as cheerio from 'cheerio';

export interface WooCommerceProduct {
  name: string;
  price: string;
  sku?: string;
  categories: string[];
  inStock: boolean;
  url: string;
}

export interface WooCommerceData {
  products: WooCommerceProduct[];
  categories: string[];
  totalProducts: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  storeInfo: {
    name?: string;
    description?: string;
    socialLinks?: string[];
  };
}

/**
 * Detect if a site is running WooCommerce
 */
export async function isWooCommerceSite(url: string): Promise<boolean> {
  try {
    const html = await fetchHtml(url, 5000);
    const $ = cheerio.load(html);

    // WooCommerce indicators
    const indicators = [
      'script[src*="woocommerce"]',
      'link[href*="woocommerce"]',
      '.woocommerce',
      '.woocommerce-page',
      '.product.type-product',
      'body.woocommerce',
      '#woocommerce',
      'form.cart',
      '.single-product',
    ];

    for (const indicator of indicators) {
      if ($(indicator).length > 0) {
        return true;
      }
    }

    // Check for WooCommerce REST API
    if (html.includes('wc-api') || html.includes('/wp-json/wc/')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Scrape WooCommerce store
 */
export async function scrapeWooCommerceSite(
  startUrl: string,
  maxPages = 12,
  timeout = 8000,
): Promise<WooCommerceData> {
  const u = new URL(startUrl);
  const origin = u.origin;
  const visited = new Set<string>();
  const products: WooCommerceProduct[] = [];
  const categories = new Set<string>();
  const prices: number[] = [];
  const socialLinks = new Set<string>();
  let storeName = '';
  let storeDescription = '';
  let currency = 'USD';

  // Priority pages to scrape
  const priorityPaths = ['/', '/shop', '/shop/', '/products', '/store', '/about', '/about-us'];

  const queue = priorityPaths.map((path) => `${origin}${path}`);

  // Try WooCommerce REST API first
  try {
    const apiUrl = `${origin}/wp-json/wc/v3/products`;
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(timeout),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (response.ok) {
      const apiProducts = await response.json();
      for (const p of apiProducts.slice(0, 30)) {
        products.push({
          name: p.name,
          price: p.price,
          sku: p.sku,
          categories: p.categories?.map((c: any) => c.name) || [],
          inStock: p.stock_status === 'instock',
          url: p.permalink,
        });

        const numPrice = parseFloat(p.price);
        if (numPrice > 0) prices.push(numPrice);

        p.categories?.forEach((c: any) => categories.add(c.name));
      }
    }
  } catch {
    // API not available, continue with scraping
  }

  // Scrape pages
  for (const url of queue) {
    if (visited.size >= maxPages) break;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const html = await fetchHtml(url, timeout);
      const $ = cheerio.load(html);

      // Extract store name
      if (!storeName) {
        storeName =
          $('meta[property="og:site_name"]').attr('content') ||
          $('.site-title, .site-name').first().text().trim() ||
          $('title').text().split('|')[0].trim();
      }

      // Extract store description
      if (!storeDescription && url.includes('about')) {
        storeDescription = $('.entry-content, .page-content, main').first().text().slice(0, 500);
      }

      // Extract products
      $('.product, .type-product, .woocommerce-loop-product__link').each((_, el) => {
        const $el = $(el);
        const name =
          $el
            .find('.woocommerce-loop-product__title, .product-title, h2, h3')
            .first()
            .text()
            .trim() ||
          $el.find('a').first().attr('title') ||
          '';

        const priceText = $el
          .find('.price, .amount, .woocommerce-Price-amount')
          .first()
          .text()
          .trim();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        const price = priceMatch ? priceMatch[0] : '';

        const productUrl = $el.find('a').first().attr('href') || $el.attr('href') || '';
        const fullUrl = productUrl.startsWith('http') ? productUrl : `${origin}${productUrl}`;

        const inStock = !$el.find('.out-of-stock, .outofstock').length;

        // Extract categories
        const productCategories: string[] = [];
        $el.find('.product-category, .category').each((_, catEl) => {
          const cat = $(catEl).text().trim();
          if (cat) {
            productCategories.push(cat);
            categories.add(cat);
          }
        });

        if (name && products.length < 50) {
          products.push({
            name,
            price,
            sku: $el.find('.sku').text().trim(),
            categories: productCategories,
            inStock,
            url: fullUrl,
          });

          const numPrice = parseFloat(price.replace(/,/g, ''));
          if (numPrice > 0) prices.push(numPrice);
        }
      });

      // Extract currency
      const currencySymbol = $('.woocommerce-Price-currencySymbol').first().text();
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

      // Find more product pages
      if (visited.size < maxPages) {
        $('a[href*="/product/"], a[href*="/shop/"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href) {
            try {
              const productUrl = new URL(href, url).href;
              if (
                productUrl.startsWith(origin) &&
                !visited.has(productUrl) &&
                queue.length < maxPages * 2
              ) {
                queue.push(productUrl);
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
    categories: Array.from(categories).slice(0, 15),
    totalProducts: products.length,
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      currency,
    },
    storeInfo: {
      name: storeName,
      description: storeDescription,
      socialLinks: Array.from(socialLinks),
    },
  };
}

/**
 * Convert WooCommerce data to text for analysis
 */
export function woocommerceDataToContent(data: WooCommerceData): string {
  const sections = [];

  if (data.storeInfo.name) {
    sections.push(`STORE: ${data.storeInfo.name}`);
  }

  if (data.storeInfo.description) {
    sections.push(`\nABOUT:\n${data.storeInfo.description}`);
  }

  sections.push(`\nPRODUCTS (${data.totalProducts} total):`);
  sections.push(
    `Price range: ${data.priceRange.currency} ${data.priceRange.min}-${data.priceRange.max}`,
  );

  if (data.products.length > 0) {
    const productList = data.products
      .slice(0, 15)
      .map(
        (p) =>
          `- ${p.name}: ${data.priceRange.currency} ${p.price}${!p.inStock ? ' (Out of Stock)' : ''}${p.categories.length ? ' | ' + p.categories.join(', ') : ''}`,
      );
    sections.push(productList.join('\n'));
  }

  if (data.categories.length > 0) {
    sections.push(`\nCATEGORIES: ${data.categories.join(', ')}`);
  }

  if (data.storeInfo.socialLinks && data.storeInfo.socialLinks.length > 0) {
    sections.push(`\nSOCIAL MEDIA: ${data.storeInfo.socialLinks.length} channels`);
  }

  return sections.join('\n\n');
}
