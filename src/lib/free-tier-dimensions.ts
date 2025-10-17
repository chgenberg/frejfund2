/**
 * Free Tier Dimensions - 30 critical dimensions that can be extracted from web + basic documents
 * These dimensions are selected based on:
 * 1. Can be extracted from public web content
 * 2. Don't require financial documents or internal metrics
 * 3. Provide immediate value to founders
 */

import { AnalysisDimension } from './deep-analysis-framework';

export interface FreeDimension extends AnalysisDimension {
  required_sources: string[]; // What data sources are needed
  confidence_without_docs: 'high' | 'medium' | 'low'; // How confident can we be without documents
}

export const FREE_TIER_DIMENSIONS: FreeDimension[] = [
  // === CRITICAL WEB-EXTRACTABLE DIMENSIONS ===
  {
    id: 'problem-clarity',
    category: 'Problem & Solution',
    name: 'Problem Clarity',
    description: 'How well-defined and urgent is the problem being solved?',
    priority: 'critical',
    required_sources: ['website', 'landing_page'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Analyze if ${bi.companyName} clearly articulates a specific, urgent problem. Look for: problem statement, pain points mentioned, customer quotes about the problem. Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for problem statements, pain points, "the problem is", customer complaints'
  },
  {
    id: 'solution-fit',
    category: 'Problem & Solution',
    name: 'Solution-Problem Fit',
    description: 'How directly does the solution address the stated problem?',
    priority: 'critical',
    required_sources: ['website', 'product_pages'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Evaluate how well ${bi.companyName}'s solution directly solves the identified problem. Is it a vitamin or painkiller? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Match solution features to problem statements'
  },
  {
    id: 'unique-insight',
    category: 'Problem & Solution',
    name: 'Unique Insight',
    description: 'Does the team have a non-obvious insight about the market?',
    priority: 'high',
    required_sources: ['website', 'about_page', 'blog'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Identify if ${bi.companyName} has a unique/contrarian insight about their market that others missed. Look for: "we realized", "unlike everyone else", "the real problem is". Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for contrarian statements, unique observations, "aha moments"'
  },
  {
    id: 'market-size',
    category: 'Market & Competition',
    name: 'Market Size (TAM/SAM/SOM)',
    description: 'How large is the addressable market?',
    priority: 'critical',
    required_sources: ['website', 'pitch_deck', 'industry_reports'],
    confidence_without_docs: 'low',
    prompt: (bi, content) => `Extract or estimate the TAM, SAM, and SOM for ${bi.companyName} in ${bi.industry}. Look for market size mentions, industry reports cited. Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract: "$X billion market", "X million potential customers"'
  },
  {
    id: 'competition-landscape',
    category: 'Market & Competition',
    name: 'Competitive Landscape',
    description: 'Who are the main competitors and how crowded is the space?',
    priority: 'critical',
    required_sources: ['website', 'comparison_pages', 'web_search'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `List ${bi.companyName}'s main competitors and assess market crowdedness. Look for: competitor mentions, "unlike X", comparison charts. Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract competitor names, comparison sections, "vs" mentions'
  },
  {
    id: 'competitive-moat',
    category: 'Market & Competition',
    name: 'Competitive Moat/Defensibility',
    description: 'What prevents competitors from copying this?',
    priority: 'critical',
    required_sources: ['website', 'product_pages', 'tech_blog'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Identify ${bi.companyName}'s defensibility: network effects, proprietary data, patents, brand, high switching costs? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for: patents, proprietary tech, network effects, data advantages'
  },
  {
    id: 'revenue-model',
    category: 'Business Model',
    name: 'Revenue Model Clarity',
    description: 'How do they make money? Is it proven?',
    priority: 'critical',
    required_sources: ['pricing_page', 'website'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Describe ${bi.companyName}'s revenue model in detail. Subscription? Usage-based? Marketplace fee? Is it working? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract: pricing pages, "how it works", revenue mentions'
  },
  {
    id: 'pricing-power',
    category: 'Business Model',
    name: 'Pricing Strategy',
    description: 'How is the product priced? Premium or commodity?',
    priority: 'medium',
    required_sources: ['pricing_page', 'competitor_pricing'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Assess ${bi.companyName}'s pricing strategy. Premium, freemium, or low-cost? Compare to competitors. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: pricing tiers, free trials, competitor pricing'
  },
  {
    id: 'customer-acquisition-strategy',
    category: 'Go-to-Market',
    name: 'Customer Acquisition Strategy',
    description: 'How do they find customers? Repeatable?',
    priority: 'critical',
    required_sources: ['website', 'signup_flow', 'marketing_content'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `What's ${bi.companyName}'s customer acquisition strategy? PLG? Enterprise sales? Partnerships? Is it repeatable and scalable? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Analyze: signup flow, sales process, channel strategy'
  },
  {
    id: 'icp-clarity',
    category: 'Go-to-Market',
    name: 'Ideal Customer Profile Clarity',
    description: 'Do they know exactly who their best customer is?',
    priority: 'high',
    required_sources: ['website', 'case_studies', 'testimonials'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `How well-defined is ${bi.companyName}'s ICP? Can they describe their perfect customer in detail? Target market: ${bi.targetMarket}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: customer examples, case studies, targeting'
  },
  {
    id: 'founder-background',
    category: 'Team & Execution',
    name: 'Founder-Market Fit',
    description: 'Why are these founders uniquely suited to solve this?',
    priority: 'critical',
    required_sources: ['about_page', 'linkedin', 'founder_profiles'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Why are the founders of ${bi.companyName} uniquely positioned to solve this problem? Domain expertise? Previous experience? LinkedIn: ${bi.linkedinUrl}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: founder bios, "about us", previous companies'
  },
  {
    id: 'team-completeness',
    category: 'Team & Execution',
    name: 'Team Completeness',
    description: 'Do they have the right skills: tech, sales, product?',
    priority: 'high',
    required_sources: ['team_page', 'linkedin', 'about_page'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Does ${bi.companyName}'s team have: strong tech lead, sales/GTM expert, product visionary? Team size: ${bi.teamSize}. What's missing? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze team page, roles, gaps in skillsets'
  },
  {
    id: 'product-simplicity',
    category: 'Problem & Solution',
    name: 'Solution Simplicity',
    description: 'Can the solution be explained in one sentence?',
    priority: 'medium',
    required_sources: ['website', 'hero_section'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Can you explain ${bi.companyName}'s solution in ONE clear sentence? Is their value prop simple or convoluted? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Extract tagline, hero statement, "we help X do Y"'
  },
  {
    id: 'why-now',
    category: 'Problem & Solution',
    name: 'Why Now?',
    description: 'What recent change makes this solution possible/necessary now?',
    priority: 'high',
    required_sources: ['website', 'blog', 'market_analysis'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `What recent technology, regulation, or market shift makes ${bi.companyName} possible NOW (not 5 years ago)? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for: recent trends, new tech, regulatory changes, COVID impacts'
  },
  {
    id: 'tech-differentiation',
    category: 'Product & Technology',
    name: 'Technical Differentiation',
    description: 'Is there real tech innovation or just UX wrapper?',
    priority: 'high',
    required_sources: ['tech_blog', 'product_pages', 'github'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Is ${bi.companyName} building real technical innovation or just better UX on existing tech? Any proprietary algorithms, AI, or infrastructure? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: tech blog, patents, technical descriptions'
  },
  {
    id: 'customer-love',
    category: 'Customer Validation',
    name: 'Customer Love/NPS',
    description: 'Do customers genuinely love the product?',
    priority: 'high',
    required_sources: ['testimonials', 'reviews', 'case_studies'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Evidence that ${bi.companyName}'s customers LOVE the product? Testimonials, NPS, reviews, case studies? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract: testimonials, reviews, NPS mentions, social proof'
  },
  {
    id: 'social-proof',
    category: 'Social Proof',
    name: 'Social Proof & Credibility',
    description: 'Press coverage, awards, notable customers?',
    priority: 'medium',
    required_sources: ['website', 'press_mentions', 'customer_logos'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `What social proof does ${bi.companyName} have? Press mentions, awards, notable customers, investor backing? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: "as seen in", customer logos, awards, press'
  },
  {
    id: 'market-positioning',
    category: 'Storytelling',
    name: 'Market Positioning',
    description: 'How do they position vs competitors?',
    priority: 'high',
    required_sources: ['website', 'comparison_pages'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `How does ${bi.companyName} position themselves? "X for Y"? "Unlike competitors, we..."? Clear differentiation? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: taglines, positioning statements, competitor comparisons'
  },
  {
    id: 'vision-ambition',
    category: 'Storytelling',
    name: 'Vision & Ambition Level',
    description: 'Are they thinking big enough for VC returns?',
    priority: 'high',
    required_sources: ['website', 'mission_statement', 'blog'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Is ${bi.companyName}'s vision big enough for 100x returns? "Change the world" or "nice business"? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: mission statement, long-term vision, ambition signals'
  },
  {
    id: 'execution-velocity',
    category: 'Team & Execution',
    name: 'Execution Velocity',
    description: 'How fast do they ship and iterate?',
    priority: 'high',
    required_sources: ['changelog', 'blog', 'product_updates'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Assess ${bi.companyName}'s execution velocity. How often do they ship? Product updates? Blog posts? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: changelog, blog frequency, product updates'
  },
  {
    id: 'regulatory-risk',
    category: 'Risks',
    name: 'Regulatory/Compliance Risk',
    description: 'Are they in a heavily regulated industry?',
    priority: 'high',
    required_sources: ['website', 'compliance_pages', 'terms'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `What regulatory risks does ${bi.companyName} face? FDA? GDPR? Financial licensing? Industry: ${bi.industry}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Check: compliance mentions, certifications, legal pages'
  },
  {
    id: 'key-dependency-risk',
    category: 'Risks',
    name: 'Key Dependency Risk',
    description: 'Reliant on one customer, supplier, or platform?',
    priority: 'high',
    required_sources: ['website', 'integrations', 'partnerships'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Is ${bi.companyName} dangerously dependent on: one customer, supplier, API/platform, or technology? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: integrations, partnerships, platform mentions'
  },
  {
    id: 'competitive-threat',
    category: 'Risks',
    name: 'Competitive Threat Level',
    description: 'Could Big Tech crush them easily?',
    priority: 'high',
    required_sources: ['market_analysis', 'competitor_analysis'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `If Google/Microsoft/Amazon decided to compete with ${bi.companyName}, could they easily win? What's the defense? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Assess: moats, network effects, switching costs'
  },
  {
    id: 'platform-vs-feature',
    category: 'Product & Technology',
    name: 'Platform vs Feature Risk',
    description: 'Could this be a feature of a larger product?',
    priority: 'high',
    required_sources: ['product_analysis', 'market_positioning'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Is ${bi.companyName} building a platform/company or just a feature that Salesforce/Microsoft could add? How defensible? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: scope, integration depth, ecosystem'
  },
  {
    id: 'sales-cycle-length',
    category: 'Go-to-Market',
    name: 'Sales Cycle Length',
    description: 'How long from first touch to closed deal?',
    priority: 'high',
    required_sources: ['pricing_page', 'sales_process'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `What's ${bi.companyName}'s sales cycle length? PLG (instant), SMB (weeks), Enterprise (months)? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Infer from: pricing, demos, trial structure'
  },
  {
    id: 'product-velocity',
    category: 'Product & Technology',
    name: 'Product Development Velocity',
    description: 'How fast can they ship new features?',
    priority: 'medium',
    required_sources: ['changelog', 'release_notes'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `How fast does ${bi.companyName} ship new features? Check: changelog, product updates, roadmap. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: changelog frequency, update mentions'
  },
  {
    id: 'market-timing',
    category: 'Market & Competition',
    name: 'Market Timing',
    description: 'Is this too early, just right, or too late?',
    priority: 'high',
    required_sources: ['market_analysis', 'adoption_signals'],
    confidence_without_docs: 'medium',
    prompt: (bi, content) => `Assess if ${bi.companyName} is entering the market too early (educating), just right (riding wave), or too late (saturated). Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze maturity indicators, adoption mentions'
  },
  {
    id: 'monetization-strategy',
    category: 'Business Model',
    name: 'Monetization Strategy',
    description: 'Do they charge the right customer at the right time?',
    priority: 'medium',
    required_sources: ['pricing_page', 'free_trial'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `Evaluate ${bi.companyName}'s monetization strategy. Are they charging the person who gets value? Freemium? PLG? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: free tier, trial structure, value metric'
  },
  {
    id: 'customer-logos',
    category: 'Social Proof',
    name: 'Customer Logo Quality',
    description: 'Do they have recognizable customer brands?',
    priority: 'medium',
    required_sources: ['website', 'case_studies'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `What recognizable brands use ${bi.companyName}? Fortune 500? Well-known startups? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: customer logos, case studies, "trusted by"'
  },
  {
    id: 'narrative-quality',
    category: 'Storytelling',
    name: 'Founder Story/Narrative',
    description: 'Is there a compelling origin story?',
    priority: 'medium',
    required_sources: ['about_page', 'founder_story'],
    confidence_without_docs: 'high',
    prompt: (bi, content) => `What's ${bi.companyName}'s origin story? Why did founders start this? Personal connection to problem? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: about us, founder stories, "why we started"'
  }
];

// Get IDs of free tier dimensions
export const FREE_TIER_DIMENSION_IDS = FREE_TIER_DIMENSIONS.map(d => d.id);

// Helper to check if a dimension is in free tier
export function isFreeTierDimension(dimensionId: string): boolean {
  return FREE_TIER_DIMENSION_IDS.includes(dimensionId);
}

// Get dimensions that need specific document types
export function getDimensionsNeedingDocuments(): Record<string, FreeDimension[]> {
  const result: Record<string, FreeDimension[]> = {
    pitch_deck: [],
    financial_docs: [],
    customer_data: [],
    product_analytics: []
  };

  FREE_TIER_DIMENSIONS.forEach(dim => {
    if (dim.required_sources.includes('pitch_deck')) {
      result.pitch_deck.push(dim);
    }
    if (dim.required_sources.includes('financial_statements') || dim.required_sources.includes('kpi_report')) {
      result.financial_docs.push(dim);
    }
    if (dim.required_sources.includes('customer_data') || dim.required_sources.includes('testimonials')) {
      result.customer_data.push(dim);
    }
    if (dim.required_sources.includes('analytics') || dim.required_sources.includes('metrics')) {
      result.product_analytics.push(dim);
    }
  });

  return result;
}
