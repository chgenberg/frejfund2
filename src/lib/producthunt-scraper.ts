/**
 * Product Hunt Scraper
 * Analyzes Product Hunt launches for community traction signals
 * Server-side only
 */

// Ensure this only runs on server
if (typeof window !== 'undefined') {
  throw new Error('producthunt-scraper must only be used server-side');
}

export interface ProductHuntData {
  productName: string;
  tagline?: string;
  description?: string;
  website?: string;
  
  // Launch metrics
  launches: Array<{
    date: string;
    upvotes: number;
    comments: number;
    rank?: number; // Daily rank
    featured?: boolean;
  }>;
  
  // Community metrics
  totalUpvotes: number;
  totalComments: number;
  followers?: number;
  
  // Sentiment analysis
  topComments?: Array<{
    text: string;
    upvotes: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
  }>;
  
  // Launch success
  bestRank?: number;
  wasFeatured: boolean;
  productOfTheDay?: boolean;
  
  // Maker information
  makers?: Array<{
    name: string;
    role?: string;
  }>;
  
  // Traction signal
  communityInterest: 'viral' | 'strong' | 'moderate' | 'weak';
  
  // Metadata
  productHuntUrl?: string;
  scrapedAt: Date;
}

/**
 * Scrape Product Hunt using their public API
 * Note: Requires API token from https://api.producthunt.com/v2/docs
 */
export async function scrapeProductHunt(
  productNameOrUrl: string
): Promise<ProductHuntData | null> {
  try {
    const phToken = process.env.PRODUCTHUNT_API_TOKEN;
    
    if (!phToken) {
      console.warn('PRODUCTHUNT_API_TOKEN not set, using web scraping fallback');
      return scrapeProductHuntWeb(productNameOrUrl);
    }

    // Use GraphQL API
    const query = `
      query GetProduct($slug: String!) {
        post(slug: $slug) {
          id
          name
          tagline
          description
          votesCount
          commentsCount
          website
          url
          featuredAt
          
          makers {
            name
          }
          
          comments(first: 10, order: VOTES) {
            edges {
              node {
                body
                votesCount
              }
            }
          }
        }
      }
    `;

    const slug = extractProductSlug(productNameOrUrl);

    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${phToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { slug }
      })
    });

    if (!response.ok) {
      throw new Error(`Product Hunt API returned ${response.status}`);
    }

    const result = await response.json();
    const product = result.data?.post;

    if (!product) {
      console.error('Product not found on Product Hunt');
      return null;
    }

    // Determine community interest level
    let communityInterest: 'viral' | 'strong' | 'moderate' | 'weak' = 'weak';
    if (product.votesCount > 1000) communityInterest = 'viral';
    else if (product.votesCount > 300) communityInterest = 'strong';
    else if (product.votesCount > 100) communityInterest = 'moderate';

    // Parse comments
    const topComments = product.comments.edges.map((edge: any) => ({
      text: edge.node.body,
      upvotes: edge.node.votesCount,
      sentiment: analyzeSentiment(edge.node.body)
    }));

    return {
      productName: product.name,
      tagline: product.tagline,
      description: product.description,
      website: product.website,
      launches: [{
        date: product.featuredAt,
        upvotes: product.votesCount,
        comments: product.commentsCount,
        featured: !!product.featuredAt
      }],
      totalUpvotes: product.votesCount,
      totalComments: product.commentsCount,
      topComments,
      wasFeatured: !!product.featuredAt,
      productOfTheDay: product.votesCount > 500, // Rough estimate
      makers: product.makers.map((m: any) => ({ name: m.name })),
      communityInterest,
      productHuntUrl: product.url,
      scrapedAt: new Date()
    };

  } catch (error) {
    console.error('Product Hunt scraping error:', error);
    return null;
  }
}

/**
 * Fallback: Web scraping when API token not available
 */
async function scrapeProductHuntWeb(
  productNameOrUrl: string
): Promise<ProductHuntData | null> {
  try {
    let productUrl = productNameOrUrl;
    
    if (!productUrl.includes('producthunt.com')) {
      // Search for product
      productUrl = `https://www.producthunt.com/posts/${productNameOrUrl.toLowerCase().replace(/\s+/g, '-')}`;
    }

    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Parse using regex (basic approach)
    const productName = extractText(html, /<h1[^>]*>(.*?)<\/h1>/i) || 'Unknown Product';
    const tagline = extractText(html, /<meta property="og:description" content="([^"]*)">/i);
    const upvotes = extractNumber(html, /(\d+)\s*upvotes?/i) || 0;
    const comments = extractNumber(html, /(\d+)\s*comments?/i) || 0;

    let communityInterest: 'viral' | 'strong' | 'moderate' | 'weak' = 'weak';
    if (upvotes > 1000) communityInterest = 'viral';
    else if (upvotes > 300) communityInterest = 'strong';
    else if (upvotes > 100) communityInterest = 'moderate';

    return {
      productName,
      tagline,
      launches: [{
        date: new Date().toISOString(),
        upvotes,
        comments
      }],
      totalUpvotes: upvotes,
      totalComments: comments,
      wasFeatured: upvotes > 100,
      communityInterest,
      productHuntUrl: productUrl,
      scrapedAt: new Date()
    };

  } catch (error) {
    console.error('Product Hunt web scraping error:', error);
    return null;
  }
}

/**
 * Search Product Hunt for a company's products
 */
export async function searchProductHunt(
  companyName: string
): Promise<ProductHuntData[]> {
  try {
    const searchUrl = `https://www.producthunt.com/search?q=${encodeURIComponent(companyName)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    
    // Parse search results to find product URLs
    // This is a simplified version - in production, use proper HTML parser
    const productUrls = extractAllMatches(html, /href="(\/posts\/[^"]+)"/g)
      .map(url => `https://www.producthunt.com${url}`)
      .slice(0, 3); // Limit to first 3 results

    // Scrape each product
    const results = await Promise.all(
      productUrls.map(url => scrapeProductHuntWeb(url))
    );

    return results.filter(r => r !== null) as ProductHuntData[];

  } catch (error) {
    console.error('Product Hunt search error:', error);
    return [];
  }
}

// Helper functions
function extractProductSlug(input: string): string {
  if (input.includes('producthunt.com/posts/')) {
    return input.split('/posts/')[1].split('/')[0].split('?')[0];
  }
  return input.toLowerCase().replace(/\s+/g, '-');
}

function extractText(html: string, regex: RegExp): string | undefined {
  const match = html.match(regex);
  return match?.[1]?.replace(/<[^>]*>/g, '').trim();
}

function extractNumber(html: string, regex: RegExp): number | undefined {
  const match = html.match(regex);
  if (match && match[1]) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return undefined;
}

function extractAllMatches(html: string, regex: RegExp): string[] {
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)]; // Remove duplicates
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['great', 'awesome', 'love', 'excellent', 'amazing', 'perfect', 'brilliant'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'disappointing', 'useless'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

