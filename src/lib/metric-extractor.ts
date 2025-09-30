import { getChatModel } from './ai-client';

interface ExtractedMetrics {
  mrr?: string;
  revenue?: string;
  users?: string;
  customers?: string;
  growth?: string;
  churn?: string;
  teamSize?: number;
  cac?: string;
  ltv?: string;
  burnRate?: string;
  runway?: string;
  fundingAsk?: number;
  useOfFunds?: string;
  confidence: number; // 0-100, how confident AI is in extraction
}

/**
 * Extract key business metrics from text (pitch deck, documents, etc.)
 */
export async function extractMetricsFromText(text: string): Promise<ExtractedMetrics> {
  const prompt = `Extract key business metrics from this text. Be precise and only extract if clearly stated.

Text:
${text.substring(0, 10000)}

Extract these metrics if present:
- MRR or Monthly Revenue (e.g., "$87k", "$87,000")
- Annual Revenue (e.g., "$1M ARR")
- Users or Customers (e.g., "342 customers", "1,200 users")
- Growth rate (e.g., "+18% MoM", "25% monthly growth")
- Churn rate (e.g., "2% monthly churn", "<2%")
- Team size (e.g., "4 people", "team of 6")
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Burn rate (e.g., "$50k/month burn")
- Runway (e.g., "12 months runway")
- Funding ask (e.g., "raising $2M", "seeking $3.5M")
- Use of funds (e.g., "for product development and hiring")

Return ONLY valid JSON (no markdown):
{
  "mrr": "string or null",
  "revenue": "string or null",
  "users": "string or null",
  "customers": "string or null",
  "growth": "string or null",
  "churn": "string or null",
  "teamSize": number or null,
  "cac": "string or null",
  "ltv": "string or null",
  "burnRate": "string or null",
  "runway": "string or null",
  "fundingAsk": number or null,
  "useOfFunds": "string or null",
  "confidence": number (0-100)
}

If you can't find a metric, set it to null. Set confidence based on how clear the metrics are.`;

  try {
    const openai = getChatModel('simple');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1, // Low temp for accuracy
      response_format: { type: 'json_object' }
    });

    const result = response.choices[0].message.content?.trim() || '{}';
    const metrics = JSON.parse(result);

    return {
      mrr: metrics.mrr || undefined,
      revenue: metrics.revenue || undefined,
      users: metrics.users || undefined,
      customers: metrics.customers || undefined,
      growth: metrics.growth || undefined,
      churn: metrics.churn || undefined,
      teamSize: metrics.teamSize || undefined,
      cac: metrics.cac || undefined,
      ltv: metrics.ltv || undefined,
      burnRate: metrics.burnRate || undefined,
      runway: metrics.runway || undefined,
      fundingAsk: metrics.fundingAsk || undefined,
      useOfFunds: metrics.useOfFunds || undefined,
      confidence: metrics.confidence || 0
    };
  } catch (error) {
    console.error('Error extracting metrics:', error);
    return { confidence: 0 };
  }
}

/**
 * Generate confirmation message for extracted metrics
 */
export function generateMetricsConfirmation(metrics: ExtractedMetrics): string {
  const found: string[] = [];

  if (metrics.mrr) found.push(`• MRR: ${metrics.mrr}`);
  if (metrics.revenue) found.push(`• Revenue: ${metrics.revenue}`);
  if (metrics.users) found.push(`• Users: ${metrics.users}`);
  if (metrics.customers) found.push(`• Customers: ${metrics.customers}`);
  if (metrics.growth) found.push(`• Growth: ${metrics.growth}`);
  if (metrics.churn) found.push(`• Churn: ${metrics.churn}`);
  if (metrics.teamSize) found.push(`• Team size: ${metrics.teamSize}`);
  if (metrics.cac) found.push(`• CAC: ${metrics.cac}`);
  if (metrics.ltv) found.push(`• LTV: ${metrics.ltv}`);
  if (metrics.fundingAsk) found.push(`• Raising: $${(metrics.fundingAsk / 1000000).toFixed(1)}M`);

  if (found.length === 0) {
    return "I couldn't find specific metrics in your documents. Let's add them manually - it only takes 2 minutes!";
  }

  let message = `Great! I found these metrics from your documents:\n\n${found.join('\n')}`;
  
  message += `\n\n**Is this correct?** Reply:\n`;
  message += `• "Yes" - I'll save these\n`;
  message += `• "Edit [metric]" - To change specific values\n`;
  message += `• "Add more metrics" - To provide additional data`;

  if (metrics.confidence < 70) {
    message += `\n\n⚠️ Note: I'm ${metrics.confidence}% confident. Please verify these numbers.`;
  }

  return message;
}

/**
 * Identify missing critical metrics
 */
export function getMissingMetrics(metrics: ExtractedMetrics): string[] {
  const missing: string[] = [];

  if (!metrics.mrr && !metrics.revenue) missing.push('Revenue/MRR');
  if (!metrics.users && !metrics.customers) missing.push('Customer/User count');
  if (!metrics.growth) missing.push('Growth rate');
  if (!metrics.fundingAsk) missing.push('Funding amount');

  return missing;
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(
  hasBasicInfo: boolean,
  metrics: ExtractedMetrics,
  hasPitchDeck: boolean
): number {
  let score = 0;

  // Basic info (20%)
  if (hasBasicInfo) score += 20;

  // Revenue metrics (25%)
  if (metrics.mrr || metrics.revenue) score += 25;

  // Customer metrics (20%)
  if (metrics.users || metrics.customers) score += 20;

  // Growth (15%)
  if (metrics.growth) score += 15;

  // Funding ask (10%)
  if (metrics.fundingAsk) score += 10;

  // Pitch deck (10%)
  if (hasPitchDeck) score += 10;

  return Math.min(100, score);
}
