/**
 * Deep Analysis Framework - 50+ Dimensions for Investment Coaching
 * Runs in background after initial scraping to build comprehensive company profile
 */

import { BusinessInfo } from '@/types/business';

export interface AnalysisDimension {
  id: string;
  category: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  prompt: (businessInfo: BusinessInfo, scrapedContent: string) => string;
  extractionLogic: string; // What to look for
}

export interface DeepAnalysisResult {
  dimension: string;
  score: number; // 0-100
  findings: string[];
  redFlags: string[];
  strengths: string[];
  questionsToAsk: string[];
  suggestions: string[];
}

export const ANALYSIS_DIMENSIONS: AnalysisDimension[] = [
  // ===== CATEGORY 1: PROBLEM & SOLUTION (6 dimensions) =====
  {
    id: 'problem-clarity',
    category: 'Problem & Solution',
    name: 'Problem Clarity',
    description: 'How well-defined and urgent is the problem being solved?',
    priority: 'critical',
    prompt: (bi, content) =>
      `Analyze if ${bi.companyName} clearly articulates a specific, urgent problem. Look for: problem statement, pain points mentioned, customer quotes about the problem. Content: ${content.slice(0, 2000)}`,
    extractionLogic:
      'Look for problem statements, pain points, "the problem is", customer complaints',
  },
  {
    id: 'solution-fit',
    category: 'Problem & Solution',
    name: 'Solution-Problem Fit',
    description: 'How directly does the solution address the stated problem?',
    priority: 'critical',
    prompt: (bi, content) =>
      `Evaluate how well ${bi.companyName}'s solution directly solves the identified problem. Is it a vitamin or painkiller? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Match solution features to problem statements',
  },
  {
    id: 'unique-insight',
    category: 'Problem & Solution',
    name: 'Unique Insight',
    description: 'Does the team have a non-obvious insight about the market?',
    priority: 'high',
    prompt: (bi, content) =>
      `Identify if ${bi.companyName} has a unique/contrarian insight about their market that others missed. Look for: "we realized", "unlike everyone else", "the real problem is". Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for contrarian statements, unique observations, "aha moments"',
  },
  {
    id: 'product-simplicity',
    category: 'Problem & Solution',
    name: 'Solution Simplicity',
    description: 'Can the solution be explained in one sentence?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Can you explain ${bi.companyName}'s solution in ONE clear sentence? Is their value prop simple or convoluted? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Extract tagline, hero statement, "we help X do Y"',
  },
  {
    id: 'why-now',
    category: 'Problem & Solution',
    name: 'Why Now?',
    description: 'What recent change makes this solution possible/necessary now?',
    priority: 'high',
    prompt: (bi, content) =>
      `What recent technology, regulation, or market shift makes ${bi.companyName} possible NOW (not 5 years ago)? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for: recent trends, new tech, regulatory changes, COVID impacts',
  },
  {
    id: 'magic-moment',
    category: 'Problem & Solution',
    name: 'Product Magic Moment',
    description: 'What\'s the "aha!" moment when users see the value?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Describe the specific moment when a user of ${bi.companyName} realizes "wow, this is valuable". What's the hook? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for product demos, customer testimonials, feature highlights',
  },

  // ===== CATEGORY 2: MARKET & COMPETITION (8 dimensions) =====
  {
    id: 'market-size',
    category: 'Market & Competition',
    name: 'Market Size (TAM/SAM/SOM)',
    description: 'How large is the addressable market?',
    priority: 'critical',
    prompt: (bi, content) =>
      `Extract or estimate the TAM, SAM, and SOM for ${bi.companyName} in ${bi.industry}. Look for market size mentions, industry reports cited. Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract: "$X billion market", "X million potential customers"',
  },
  {
    id: 'market-growth',
    category: 'Market & Competition',
    name: 'Market Growth Rate',
    description: 'Is the market growing, stable, or declining?',
    priority: 'high',
    prompt: (bi, content) =>
      `What's the growth rate of ${bi.companyName}'s target market? Look for: CAGR, "fastest growing", market trends. Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract: "X% CAGR", "growing at", trend mentions',
  },
  {
    id: 'competition-landscape',
    category: 'Market & Competition',
    name: 'Competitive Landscape',
    description: 'Who are the main competitors and how crowded is the space?',
    priority: 'critical',
    prompt: (bi, content) =>
      `List ${bi.companyName}'s main competitors and assess market crowdedness. Look for: competitor mentions, "unlike X", comparison charts. Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract competitor names, comparison sections, "vs" mentions',
  },
  {
    id: 'competitive-moat',
    category: 'Market & Competition',
    name: 'Competitive Moat/Defensibility',
    description: 'What prevents competitors from copying this?',
    priority: 'critical',
    prompt: (bi, content) =>
      `Identify ${bi.companyName}'s defensibility: network effects, proprietary data, patents, brand, high switching costs? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for: patents, proprietary tech, network effects, data advantages',
  },
  {
    id: 'market-timing',
    category: 'Market & Competition',
    name: 'Market Timing',
    description: 'Is this too early, just right, or too late?',
    priority: 'high',
    prompt: (bi, content) =>
      `Assess if ${bi.companyName} is entering the market too early (educating), just right (riding wave), or too late (saturated). Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze maturity indicators, adoption mentions',
  },
  {
    id: 'market-consolidation',
    category: 'Market & Competition',
    name: 'Market Consolidation Potential',
    description: 'Is this a winner-take-all or fragmented market?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Is ${bi.industry} a winner-take-all market or can multiple players co-exist? Assess consolidation potential.`,
    extractionLogic: 'Look for: platform dynamics, network effects, niche strategies',
  },
  {
    id: 'adjacent-markets',
    category: 'Market & Competition',
    name: 'Adjacent Market Opportunities',
    description: 'What related markets can they expand into?',
    priority: 'low',
    prompt: (bi, content) =>
      `Identify 3-5 adjacent markets ${bi.companyName} could expand into after dominating their core market. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for roadmap, future plans, related use cases',
  },
  {
    id: 'substitute-threats',
    category: 'Market & Competition',
    name: 'Substitute Product Threats',
    description: 'What non-obvious alternatives solve the same problem?',
    priority: 'medium',
    prompt: (bi, content) =>
      `What substitute products or workarounds exist for ${bi.companyName}? (e.g., Excel as CRM substitute). Are they vulnerable?`,
    extractionLogic: 'Identify manual processes, legacy solutions, workarounds',
  },

  // ===== CATEGORY 3: BUSINESS MODEL & ECONOMICS (9 dimensions) =====
  {
    id: 'revenue-model',
    category: 'Business Model',
    name: 'Revenue Model Clarity',
    description: 'How do they make money? Is it proven?',
    priority: 'critical',
    prompt: (bi, content) =>
      `Describe ${bi.companyName}'s revenue model in detail. Subscription? Usage-based? Marketplace fee? Is it working? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract: pricing pages, "how it works", revenue mentions',
  },
  {
    id: 'unit-economics',
    category: 'Business Model',
    name: 'Unit Economics',
    description: 'LTV/CAC ratio, gross margins, payback period',
    priority: 'critical',
    prompt: (bi, content) =>
      `Analyze ${bi.companyName}'s unit economics. Calculate or estimate: LTV, CAC, LTV:CAC ratio, CAC payback period, gross margins. Revenue: ${bi.monthlyRevenue}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: CAC, LTV, margin mentions, pricing tiers',
  },
  {
    id: 'revenue-predictability',
    category: 'Business Model',
    name: 'Revenue Predictability',
    description: 'How recurring and predictable is the revenue?',
    priority: 'high',
    prompt: (bi, content) =>
      `How predictable is ${bi.companyName}'s revenue? Subscription vs one-time? Annual contracts? Churn rate? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: contract lengths, subscription terms, renewal rates',
  },
  {
    id: 'pricing-power',
    category: 'Business Model',
    name: 'Pricing Power',
    description: 'Can they raise prices without losing customers?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Assess ${bi.companyName}'s pricing power. Are they price-makers or price-takers? Could they 2x prices? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: value-based vs cost-plus, premium positioning',
  },
  {
    id: 'gross-margin-structure',
    category: 'Business Model',
    name: 'Gross Margin Structure',
    description: 'Software-like (80%+) or services (30-50%)?',
    priority: 'high',
    prompt: (bi, content) =>
      `What's ${bi.companyName}'s gross margin structure? Pure software (high), marketplace (medium), services (low)? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Identify: COGS, fulfillment costs, human involvement',
  },
  {
    id: 'path-to-profitability',
    category: 'Business Model',
    name: 'Path to Profitability',
    description: 'When and how will they become profitable?',
    priority: 'high',
    prompt: (bi, content) =>
      `Can you see a clear path to profitability for ${bi.companyName}? When? What needs to happen? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: financial projections, breakeven analysis',
  },
  {
    id: 'revenue-diversification',
    category: 'Business Model',
    name: 'Revenue Stream Diversification',
    description: 'Single revenue source or multiple streams?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How diversified are ${bi.companyName}'s revenue streams? Single product or multiple? Customer concentration risk? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: product offerings, pricing tiers, enterprise vs SMB',
  },
  {
    id: 'monetization-strategy',
    category: 'Business Model',
    name: 'Monetization Strategy',
    description: 'Do they charge the right customer at the right time?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Evaluate ${bi.companyName}'s monetization strategy. Are they charging the person who gets value? Freemium? PLG? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: free tier, trial structure, value metric',
  },
  {
    id: 'scalability-economics',
    category: 'Business Model',
    name: 'Economic Scalability',
    description: 'Do margins improve or worsen at scale?',
    priority: 'high',
    prompt: (bi, content) =>
      `As ${bi.companyName} scales 10x, do margins improve (software) or compress (services)? Infrastructure costs? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Identify: cloud costs, human-in-loop, automation level',
  },

  // ===== CATEGORY 4: TRACTION & GROWTH (7 dimensions) =====
  {
    id: 'revenue-growth',
    category: 'Traction & Growth',
    name: 'Revenue Growth Rate',
    description: 'Month-over-month and year-over-year growth',
    priority: 'critical',
    prompt: (bi, content) =>
      `What's ${bi.companyName}'s MRR/revenue growth rate? Extract: MoM growth, YoY growth, growth charts. Current MRR: ${bi.monthlyRevenue}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: growth percentages, revenue charts, milestones',
  },
  {
    id: 'customer-acquisition',
    category: 'Traction & Growth',
    name: 'Customer Acquisition Momentum',
    description: 'How fast are they adding new customers?',
    priority: 'high',
    prompt: (bi, content) =>
      `How many customers is ${bi.companyName} adding per month? Accelerating or flat? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: customer count, "X customers", growth mentions',
  },
  {
    id: 'retention-metrics',
    category: 'Traction & Growth',
    name: 'Retention & Churn',
    description: 'Customer retention rate and churn analysis',
    priority: 'critical',
    prompt: (bi, content) =>
      `What's ${bi.companyName}'s customer retention and churn rate? Look for: NRR, GRR, churn mentions, customer lifetime. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: churn rate, retention stats, customer testimonials',
  },
  {
    id: 'product-market-fit-signals',
    category: 'Traction & Growth',
    name: 'Product-Market Fit Signals',
    description: 'Evidence of strong PMF beyond just revenue',
    priority: 'critical',
    prompt: (bi, content) =>
      `Find evidence of Product-Market Fit for ${bi.companyName}: organic growth, word-of-mouth, customers begging for features, low churn. Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Look for: testimonials, NPS, organic mentions, waitlist',
  },
  {
    id: 'sales-efficiency',
    category: 'Traction & Growth',
    name: 'Sales Efficiency (Magic Number)',
    description: 'How efficiently do they convert sales spend to revenue?',
    priority: 'high',
    prompt: (bi, content) =>
      `Calculate or estimate ${bi.companyName}'s sales efficiency (Magic Number = Net New ARR / Sales & Marketing Spend). Good if >0.75. Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Analyze: sales cycle, conversion rates, payback period',
  },
  {
    id: 'viral-coefficient',
    category: 'Traction & Growth',
    name: 'Viral/Word-of-Mouth Growth',
    description: 'Do customers naturally refer others?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Does ${bi.companyName} have viral growth? Referral program? Network effects? K-factor? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: referral mentions, invite systems, social features',
  },
  {
    id: 'market-penetration',
    category: 'Traction & Growth',
    name: 'Market Penetration Rate',
    description: 'What % of TAM have they captured?',
    priority: 'low',
    prompt: (bi, content) =>
      `What % of their Total Addressable Market has ${bi.companyName} captured? Are they 0.01% or 10%? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Calculate: customers / total potential customers',
  },

  // ===== CATEGORY 5: TEAM & EXECUTION (6 dimensions) =====
  {
    id: 'founder-background',
    category: 'Team & Execution',
    name: 'Founder-Market Fit',
    description: 'Why are these founders uniquely suited to solve this?',
    priority: 'critical',
    prompt: (bi, content) =>
      `Why are the founders of ${bi.companyName} uniquely positioned to solve this problem? Domain expertise? Previous experience? LinkedIn: ${bi.linkedinUrl}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: founder bios, "about us", previous companies',
  },
  {
    id: 'team-completeness',
    category: 'Team & Execution',
    name: 'Team Completeness',
    description: 'Do they have the right skills: tech, sales, product?',
    priority: 'high',
    prompt: (bi, content) =>
      `Does ${bi.companyName}'s team have: strong tech lead, sales/GTM expert, product visionary? Team size: ${bi.teamSize}. What's missing? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze team page, roles, gaps in skillsets',
  },
  {
    id: 'execution-velocity',
    category: 'Team & Execution',
    name: 'Execution Velocity',
    description: 'How fast do they ship and iterate?',
    priority: 'high',
    prompt: (bi, content) =>
      `Assess ${bi.companyName}'s execution velocity. How often do they ship? Product updates? Blog posts? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: changelog, blog frequency, product updates',
  },
  {
    id: 'decision-making-quality',
    category: 'Team & Execution',
    name: 'Strategic Decision Quality',
    description: 'Do they make smart, contrarian bets?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Evaluate the quality of ${bi.companyName}'s strategic decisions based on: market choices, positioning, features prioritized. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: focus, positioning, feature choices',
  },
  {
    id: 'hiring-ability',
    category: 'Team & Execution',
    name: 'Ability to Attract Talent',
    description: 'Can they hire great people?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Can ${bi.companyName} attract top talent? Look for: team quality, employer brand, careers page, perks. Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: careers page, team backgrounds, company culture',
  },
  {
    id: 'founder-commitment',
    category: 'Team & Execution',
    name: 'Founder Commitment Level',
    description: 'Full-time? Bootstrapped before raising? Skin in game?',
    priority: 'high',
    prompt: (bi, content) =>
      `How committed are ${bi.companyName}'s founders? Full-time? Self-funded initially? Previous exits that show they don't need the money? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: funding history, founder time commitment',
  },

  // ===== CATEGORY 6: GO-TO-MARKET (5 dimensions) =====
  {
    id: 'customer-acquisition-strategy',
    category: 'Go-to-Market',
    name: 'Customer Acquisition Strategy',
    description: 'How do they find customers? Repeatable?',
    priority: 'critical',
    prompt: (bi, content) =>
      `What's ${bi.companyName}'s customer acquisition strategy? PLG? Enterprise sales? Partnerships? Is it repeatable and scalable? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Analyze: signup flow, sales process, channel strategy',
  },
  {
    id: 'icp-clarity',
    category: 'Go-to-Market',
    name: 'Ideal Customer Profile Clarity',
    description: 'Do they know exactly who their best customer is?',
    priority: 'high',
    prompt: (bi, content) =>
      `How well-defined is ${bi.companyName}'s ICP? Can they describe their perfect customer in detail? Target market: ${bi.targetMarket}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: customer examples, case studies, targeting',
  },
  {
    id: 'sales-cycle-length',
    category: 'Go-to-Market',
    name: 'Sales Cycle Length',
    description: 'How long from first touch to closed deal?',
    priority: 'high',
    prompt: (bi, content) =>
      `What's ${bi.companyName}'s sales cycle length? PLG (instant), SMB (weeks), Enterprise (months)? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Infer from: pricing, demos, trial structure',
  },
  {
    id: 'channel-diversification',
    category: 'Go-to-Market',
    name: 'Channel Diversification',
    description: 'Single channel risk or multiple acquisition channels?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How diversified are ${bi.companyName}'s acquisition channels? Over-reliant on one (risky) or multiple working channels? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: paid ads, SEO, partnerships, direct sales',
  },
  {
    id: 'expansion-revenue',
    category: 'Go-to-Market',
    name: 'Expansion/Upsell Potential',
    description: 'Can they grow revenue from existing customers?',
    priority: 'high',
    prompt: (bi, content) =>
      `Does ${bi.companyName} have expansion revenue opportunity? Upsells? Cross-sells? Usage-based pricing? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Check: pricing tiers, enterprise plans, add-ons',
  },

  // ===== CATEGORY 7: PRODUCT & TECHNOLOGY (5 dimensions) =====
  {
    id: 'tech-differentiation',
    category: 'Product & Technology',
    name: 'Technical Differentiation',
    description: 'Is there real tech innovation or just UX wrapper?',
    priority: 'high',
    prompt: (bi, content) =>
      `Is ${bi.companyName} building real technical innovation or just better UX on existing tech? Any proprietary algorithms, AI, or infrastructure? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: tech blog, patents, technical descriptions',
  },
  {
    id: 'product-velocity',
    category: 'Product & Technology',
    name: 'Product Development Velocity',
    description: 'How fast can they ship new features?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How fast does ${bi.companyName} ship new features? Check: changelog, product updates, roadmap. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: changelog frequency, update mentions',
  },
  {
    id: 'technical-debt',
    category: 'Product & Technology',
    name: 'Technical Debt/Architecture',
    description: 'Will their tech scale or need rewrite at 10x?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Can ${bi.companyName}'s tech architecture scale 10-100x or will it need rebuild? Any signals of technical debt? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Infer from: tech stack mentions, performance issues',
  },
  {
    id: 'data-network-effects',
    category: 'Product & Technology',
    name: 'Data/Network Effects',
    description: 'Does the product get better with more users/data?',
    priority: 'high',
    prompt: (bi, content) =>
      `Does ${bi.companyName}'s product improve with more users or data? Network effects? Data moat? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: AI/ML mentions, network features, data advantages',
  },
  {
    id: 'platform-vs-feature',
    category: 'Product & Technology',
    name: 'Platform vs Feature Risk',
    description: 'Could this be a feature of a larger product?',
    priority: 'high',
    prompt: (bi, content) =>
      `Is ${bi.companyName} building a platform/company or just a feature that Salesforce/Microsoft could add? How defensible? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: scope, integration depth, ecosystem',
  },

  // ===== CATEGORY 8: FUNDRAISING & CAPITAL (5 dimensions) =====
  {
    id: 'capital-efficiency',
    category: 'Fundraising',
    name: 'Capital Efficiency',
    description: 'How much value created per dollar raised?',
    priority: 'high',
    prompt: (bi, content) =>
      `How capital efficient is ${bi.companyName}? Revenue per $ raised? Bootstrapped or heavily funded? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Extract: funding history, revenue/funding ratio',
  },
  {
    id: 'funding-stage-appropriate',
    category: 'Fundraising',
    name: 'Funding Stage Appropriateness',
    description: "Are they ready for the round they're raising?",
    priority: 'critical',
    prompt: (bi, content) =>
      `Is ${bi.companyName} ready for the funding stage they're targeting? Stage: ${bi.stage}. Revenue: ${bi.monthlyRevenue}. Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Match: stage vs metrics vs typical Series benchmarks',
  },
  {
    id: 'use-of-funds-clarity',
    category: 'Fundraising',
    name: 'Use of Funds Clarity',
    description: 'Do they have a clear plan for capital deployment?',
    priority: 'high',
    prompt: (bi, content) =>
      `Does ${bi.companyName} clearly articulate how they'll use investment capital? Specific milestones? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: roadmap, hiring plans, growth strategy',
  },
  {
    id: 'runway-burn',
    category: 'Fundraising',
    name: 'Runway & Burn Rate',
    description: 'How much runway left? Burn rate healthy?',
    priority: 'critical',
    prompt: (bi, content) =>
      `Calculate ${bi.companyName}'s runway and assess burn rate health. Are they default alive or dead? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Extract: funding, burn rate, cash position',
  },
  {
    id: 'valuation-expectations',
    category: 'Fundraising',
    name: 'Valuation Reasonableness',
    description: 'Are their valuation expectations realistic?',
    priority: 'high',
    prompt: (bi, content) =>
      `Based on ${bi.companyName}'s traction (MRR: ${bi.monthlyRevenue}, Stage: ${bi.stage}), what's a reasonable valuation range? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Compare: revenue multiples, stage benchmarks',
  },

  // ===== CATEGORY 9: RISKS & RED FLAGS (4 dimensions) =====
  {
    id: 'regulatory-risk',
    category: 'Risks',
    name: 'Regulatory/Compliance Risk',
    description: 'Are they in a heavily regulated industry?',
    priority: 'high',
    prompt: (bi, content) =>
      `What regulatory risks does ${bi.companyName} face? FDA? GDPR? Financial licensing? Industry: ${bi.industry}. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Check: compliance mentions, certifications, legal pages',
  },
  {
    id: 'key-dependency-risk',
    category: 'Risks',
    name: 'Key Dependency Risk',
    description: 'Reliant on one customer, supplier, or platform?',
    priority: 'high',
    prompt: (bi, content) =>
      `Is ${bi.companyName} dangerously dependent on: one customer, supplier, API/platform, or technology? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: integrations, partnerships, platform mentions',
  },
  {
    id: 'market-risk',
    category: 'Risks',
    name: 'Market Risk',
    description: 'Could the market disappear or contract?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Could ${bi.companyName}'s market disappear or shrink significantly? Pandemic-specific? Fad? Technology obsolescence? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Analyze: market sustainability, trend dependency',
  },
  {
    id: 'competitive-threat',
    category: 'Risks',
    name: 'Competitive Threat Level',
    description: 'Could Big Tech crush them easily?',
    priority: 'high',
    prompt: (bi, content) =>
      `If Google/Microsoft/Amazon decided to compete with ${bi.companyName}, could they easily win? What's the defense? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Assess: moats, network effects, switching costs',
  },

  // ===== CATEGORY 10: CUSTOMER & MARKET VALIDATION (4 dimensions) =====
  {
    id: 'customer-love',
    category: 'Customer Validation',
    name: 'Customer Love/NPS',
    description: 'Do customers genuinely love the product?',
    priority: 'high',
    prompt: (bi, content) =>
      `Evidence that ${bi.companyName}'s customers LOVE the product? Testimonials, NPS, reviews, case studies? Content: ${content.slice(0, 2000)}`,
    extractionLogic: 'Extract: testimonials, reviews, NPS mentions, social proof',
  },
  {
    id: 'customer-diversity',
    category: 'Customer Validation',
    name: 'Customer Diversity',
    description: 'One big customer or many small ones?',
    priority: 'high',
    prompt: (bi, content) =>
      `Customer concentration risk: Does ${bi.companyName} have one big customer (>20% revenue) or diversified base? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: customer logos, case studies, revenue concentration',
  },
  {
    id: 'market-demand-signals',
    category: 'Customer Validation',
    name: 'Organic Demand Signals',
    description: 'Are people seeking this out or being sold to?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Is there organic demand for ${bi.companyName}? Inbound leads? Waitlist? SEO traffic? Or purely outbound sales? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Check: inbound mentions, waitlist, organic channels',
  },
  {
    id: 'repeat-purchase',
    category: 'Customer Validation',
    name: 'Repeat Purchase/Usage',
    description: 'Do customers come back and use it regularly?',
    priority: 'high',
    prompt: (bi, content) =>
      `For ${bi.companyName}, what's the repeat usage pattern? Daily active users? Renewal rates? Habitual usage? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: engagement metrics, renewal rates, usage frequency',
  },

  // ===== CATEGORY 11: STORYTELLING & POSITIONING (3 dimensions) =====
  {
    id: 'narrative-quality',
    category: 'Storytelling',
    name: 'Founder Story/Narrative',
    description: 'Is there a compelling origin story?',
    priority: 'medium',
    prompt: (bi, content) =>
      `What's ${bi.companyName}'s origin story? Why did founders start this? Personal connection to problem? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: about us, founder stories, "why we started"',
  },
  {
    id: 'market-positioning',
    category: 'Storytelling',
    name: 'Market Positioning',
    description: 'How do they position vs competitors?',
    priority: 'high',
    prompt: (bi, content) =>
      `How does ${bi.companyName} position themselves? "X for Y"? "Unlike competitors, we..."? Clear differentiation? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: taglines, positioning statements, competitor comparisons',
  },
  {
    id: 'vision-ambition',
    category: 'Storytelling',
    name: 'Vision & Ambition Level',
    description: 'Are they thinking big enough for VC returns?',
    priority: 'high',
    prompt: (bi, content) =>
      `Is ${bi.companyName}'s vision big enough for 100x returns? "Change the world" or "nice business"? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: mission statement, long-term vision, ambition signals',
  },

  // ===== CATEGORY 12: SOCIAL PROOF & TRACTION (4 dimensions) =====
  {
    id: 'press-coverage',
    category: 'Social Proof',
    name: 'Press & Media Coverage',
    description: 'Have they been featured in notable publications?',
    priority: 'low',
    prompt: (bi, content) =>
      `What press coverage has ${bi.companyName} received? TechCrunch? Industry publications? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: press mentions, "as featured in", media logos',
  },
  {
    id: 'investor-backing',
    category: 'Social Proof',
    name: 'Existing Investor Quality',
    description: 'Do they have notable angels or VCs already?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Who has already invested in ${bi.companyName}? Notable angels? Tier 1 VCs? Strategic investors? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: investor logos, "backed by", funding announcements',
  },
  {
    id: 'advisor-quality',
    category: 'Social Proof',
    name: 'Advisor/Board Quality',
    description: 'Do they have relevant, high-quality advisors?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Who are ${bi.companyName}'s advisors? Industry experts? Former executives? How relevant? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: advisors, board members, "advised by"',
  },
  {
    id: 'customer-logos',
    category: 'Social Proof',
    name: 'Customer Logo Quality',
    description: 'Do they have recognizable customer brands?',
    priority: 'medium',
    prompt: (bi, content) =>
      `What recognizable brands use ${bi.companyName}? Fortune 500? Well-known startups? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: customer logos, case studies, "trusted by"',
  },

  // ===== CATEGORY 13: OPERATIONAL MATURITY (3 dimensions) =====
  {
    id: 'process-maturity',
    category: 'Operations',
    name: 'Process Maturity',
    description: 'Do they have repeatable processes or winging it?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How mature are ${bi.companyName}'s operations? Sales playbook? Customer success process? Onboarding flow? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Infer from: structured content, process descriptions',
  },
  {
    id: 'metrics-tracking',
    category: 'Operations',
    name: 'Metrics & Dashboard Discipline',
    description: 'Do they track and report key metrics?',
    priority: 'high',
    prompt: (bi, content) =>
      `Does ${bi.companyName} systematically track KPIs? Dashboard mentions? Data-driven culture? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: metrics mentioned, dashboard, reporting',
  },
  {
    id: 'stakeholder-communication',
    category: 'Operations',
    name: 'Stakeholder Communication',
    description: 'Do they communicate transparently with stakeholders?',
    priority: 'low',
    prompt: (bi, content) =>
      `How well does ${bi.companyName} communicate? Regular updates? Transparency? Investor updates? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: blog frequency, changelog, transparency',
  },

  // ===== CATEGORY 14: RISKS & RED FLAGS (4 dimensions) =====
  {
    id: 'founder-conflict-risk',
    category: 'Risks',
    name: 'Founder Conflict Risk',
    description: 'Signs of co-founder tension or misalignment?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Any signals of founder misalignment or conflict at ${bi.companyName}? Equity split issues? Unclear roles? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: equal splits (50/50 red flag), vague roles',
  },

  // ===== CATEGORY 15: STRATEGIC POSITIONING (3 dimensions) =====
  {
    id: 'acquisition-potential',
    category: 'Strategic',
    name: 'Acquisition Potential',
    description: 'Could they be acquired by strategic players?',
    priority: 'low',
    prompt: (bi, content) =>
      `Who might acquire ${bi.companyName}? Strategic buyers in ${bi.industry}? Why? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Identify: potential acquirers, strategic value',
  },
  {
    id: 'international-potential',
    category: 'Strategic',
    name: 'International Expansion Potential',
    description: 'Can they expand globally or local-only?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Can ${bi.companyName} expand internationally or is it geographically constrained? Localization needed? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: multi-language, international customers',
  },
  {
    id: 'ecosystem-positioning',
    category: 'Strategic',
    name: 'Ecosystem Positioning',
    description: 'Are they building with or against the ecosystem?',
    priority: 'low',
    prompt: (bi, content) =>
      `How does ${bi.companyName} position in the ecosystem? Partner with platforms or compete? Integrations? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: integrations, partnerships, API strategy',
  },

  // ===== CATEGORY 15: CUSTOMER ACQUISITION DEPTH (5 dimensions) =====
  {
    id: 'cac-trends',
    category: 'Customer Acquisition',
    name: 'CAC Trends',
    description: 'Is customer acquisition cost improving or degrading?',
    priority: 'high',
    prompt: (bi, content) =>
      `Analyze ${bi.companyName}'s CAC trends over time. Is it improving, stable, or getting worse? What's driving the change? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: CAC over time, efficiency improvements, channel performance',
  },
  {
    id: 'channel-roi',
    category: 'Customer Acquisition',
    name: 'Channel ROI Analysis',
    description: 'Which acquisition channels have best ROI?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Break down ${bi.companyName}'s ROI by acquisition channel. Which channels are most efficient? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: channel performance, conversion rates by source',
  },
  {
    id: 'conversion-funnel',
    category: 'Customer Acquisition',
    name: 'Conversion Funnel Health',
    description: 'Where are prospects dropping off?',
    priority: 'high',
    prompt: (bi, content) =>
      `Analyze ${bi.companyName}'s conversion funnel. Where are the biggest drop-offs? Visitor → Trial → Paid. Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: funnel metrics, conversion rates, drop-off points',
  },
  {
    id: 'lead-quality',
    category: 'Customer Acquisition',
    name: 'Lead Quality Score',
    description: 'Are they attracting high-quality or tire-kicker leads?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Assess the quality of ${bi.companyName}'s leads. Enterprise vs SMB? High intent vs browsers? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Analyze: customer segments, deal sizes, sales qualification',
  },
  {
    id: 'acquisition-velocity',
    category: 'Customer Acquisition',
    name: 'Customer Acquisition Speed',
    description: 'How fast can they onboard new customers?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How quickly can ${bi.companyName} acquire and activate new customers? Self-serve or high-touch? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: onboarding time, time-to-value, activation metrics',
  },

  // ===== CATEGORY 16: FINANCIAL HEALTH (5 dimensions) =====
  {
    id: 'cash-conversion',
    category: 'Financial Health',
    name: 'Cash Conversion Cycle',
    description: 'How efficiently do they convert revenue to cash?',
    priority: 'high',
    prompt: (bi, content) =>
      `Analyze ${bi.companyName}'s cash conversion cycle. How long from sale to cash collection? Any AR issues? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: payment terms, collections, cash flow timing',
  },
  {
    id: 'working-capital',
    category: 'Financial Health',
    name: 'Working Capital Management',
    description: 'Are they managing cash efficiently?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Evaluate ${bi.companyName}'s working capital management. Inventory, receivables, payables optimization? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Analyze: cash management, payment cycles, capital efficiency',
  },
  {
    id: 'debt-equity-strategy',
    category: 'Financial Health',
    name: 'Debt vs Equity Strategy',
    description: 'Are they using debt strategically or purely equity?',
    priority: 'low',
    prompt: (bi, content) =>
      `Does ${bi.companyName} use debt financing strategically? Revenue-based financing? Or pure equity? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: financing mix, debt mentions, alternative financing',
  },
  {
    id: 'financial-reporting',
    category: 'Financial Health',
    name: 'Financial Reporting Quality',
    description: 'How sophisticated is their financial tracking?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Assess ${bi.companyName}'s financial reporting maturity. Real-time dashboards? Monthly close process? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: reporting cadence, metrics tracked, financial discipline',
  },
  {
    id: 'budget-variance',
    category: 'Financial Health',
    name: 'Budget vs Actual Performance',
    description: 'How accurately do they forecast and execute?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How well does ${bi.companyName} hit their forecasts? Consistent execution or big misses? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Analyze: forecast accuracy, execution discipline',
  },

  // ===== CATEGORY 17: COMPETITIVE INTELLIGENCE (4 dimensions) =====
  {
    id: 'feature-parity',
    category: 'Competitive Intelligence',
    name: 'Feature Parity Analysis',
    description: 'Are they ahead or playing catch-up on features?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Compare ${bi.companyName}'s features vs main competitors. Leading, at parity, or lagging? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Extract: feature comparisons, unique capabilities, gaps',
  },
  {
    id: 'market-share-trajectory',
    category: 'Competitive Intelligence',
    name: 'Market Share Trajectory',
    description: 'Are they gaining or losing market share?',
    priority: 'high',
    prompt: (bi, content) =>
      `Is ${bi.companyName} gaining market share vs competitors? Growing faster or slower than market? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: relative growth rates, customer wins/losses',
  },
  {
    id: 'win-loss-analysis',
    category: 'Competitive Intelligence',
    name: 'Win/Loss Reasons',
    description: 'Why do they win or lose deals?',
    priority: 'high',
    prompt: (bi, content) =>
      `Why does ${bi.companyName} win deals? Why do they lose? Price, features, or other? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Analyze: win reasons, loss reasons, competitive positioning',
  },
  {
    id: 'pricing-competitiveness',
    category: 'Competitive Intelligence',
    name: 'Pricing vs Competition',
    description: 'Premium, at par, or discount pricing?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How does ${bi.companyName}'s pricing compare to competitors? Premium positioning or competing on price? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Compare: pricing tiers, value proposition, positioning',
  },

  // ===== CATEGORY 18: PRODUCT STRATEGY (4 dimensions) =====
  {
    id: 'roadmap-quality',
    category: 'Product Strategy',
    name: 'Product Roadmap Quality',
    description: 'Is the roadmap customer-driven or feature factory?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Evaluate ${bi.companyName}'s product roadmap. Customer-driven priorities or random features? Clear vision? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Look for: roadmap structure, prioritization logic, customer input',
  },
  {
    id: 'feature-prioritization',
    category: 'Product Strategy',
    name: 'Feature Prioritization Logic',
    description: 'How do they decide what to build next?',
    priority: 'medium',
    prompt: (bi, content) =>
      `How does ${bi.companyName} prioritize features? Data-driven? Customer requests? Strategic vision? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Analyze: decision process, customer feedback loops',
  },
  {
    id: 'technical-moat-depth',
    category: 'Product Strategy',
    name: 'Technical Moat Depth',
    description: 'How deep is their technical advantage?',
    priority: 'high',
    prompt: (bi, content) =>
      `How deep is ${bi.companyName}'s technical moat? Years ahead or easily replicable? Patents? Algorithms? Content: ${content.slice(0, 1500)}`,
    extractionLogic: 'Assess: technical complexity, IP, time to replicate',
  },
  {
    id: 'api-platform-strategy',
    category: 'Product Strategy',
    name: 'API/Platform Strategy',
    description: 'Are they building an ecosystem or closed system?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Does ${bi.companyName} have an API/platform strategy? Building ecosystem or walled garden? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: API mentions, developer docs, partner integrations',
  },

  // ===== CATEGORY 19: BRAND & MARKETING (4 dimensions) =====
  {
    id: 'brand-strength',
    category: 'Brand & Marketing',
    name: 'Brand Recognition',
    description: 'How strong is their brand in the market?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Assess ${bi.companyName}'s brand strength. Known in their space? Category leader or unknown? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: press mentions, industry recognition, brand consistency',
  },
  {
    id: 'content-marketing',
    category: 'Brand & Marketing',
    name: 'Content Marketing Quality',
    description: 'Are they thought leaders or just noise?',
    priority: 'low',
    prompt: (bi, content) =>
      `Evaluate ${bi.companyName}'s content marketing. High-quality thought leadership or generic content? SEO performance? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Analyze: blog quality, SEO rankings, content frequency',
  },
  {
    id: 'community-building',
    category: 'Brand & Marketing',
    name: 'Community Building',
    description: 'Have they built an engaged user community?',
    priority: 'medium',
    prompt: (bi, content) =>
      `Has ${bi.companyName} built a community? User forums? Slack groups? Events? How engaged? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Look for: community mentions, user groups, engagement levels',
  },
  {
    id: 'thought-leadership',
    category: 'Brand & Marketing',
    name: 'Thought Leadership',
    description: 'Are founders/team recognized experts?',
    priority: 'low',
    prompt: (bi, content) =>
      `Are ${bi.companyName}'s founders/team thought leaders? Speaking at conferences? Published articles? Content: ${content.slice(0, 1000)}`,
    extractionLogic: 'Check: speaking engagements, publications, industry visibility',
  },
];

// Helper function to categorize dimensions
export function getDimensionsByCategory(): Record<string, AnalysisDimension[]> {
  return ANALYSIS_DIMENSIONS.reduce(
    (acc, dim) => {
      if (!acc[dim.category]) {
        acc[dim.category] = [];
      }
      acc[dim.category].push(dim);
      return acc;
    },
    {} as Record<string, AnalysisDimension[]>,
  );
}

// Get only critical dimensions for fast initial analysis
export function getCriticalDimensions(): AnalysisDimension[] {
  return ANALYSIS_DIMENSIONS.filter((d) => d.priority === 'critical');
}

// Get dimensions by priority
export function getDimensionsByPriority(
  priority: 'critical' | 'high' | 'medium' | 'low',
): AnalysisDimension[] {
  return ANALYSIS_DIMENSIONS.filter((d) => d.priority === priority);
}
