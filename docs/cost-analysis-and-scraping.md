# FrejFund Cost Analysis & Enhanced Scraping Strategy

## 💰 **Token-kostnader för Deep Analysis**

### **Nuvarande setup:**

- **Modell:** GPT-4o-mini (via `getChatModel('simple')`)
- **Antal dimensioner:** 68 st
- **Körordning:** Critical → High → Medium → Low

### **Token-användning per dimension:**

#### Input tokens (per dimension):

- System prompt: ~100 tokens
- Dimension-specifik prompt: ~150 tokens
- Business info: ~200 tokens
- Scraped content (trunkerad): ~6,000 tokens
- Document content: ~2,000 tokens (genomsnitt)
- **Total input per dimension: ~8,450 tokens**

#### Output tokens (per dimension):

- JSON-strukturerad analys: ~400 tokens
- **Total output per dimension: ~400 tokens**

### **GPT-4o-mini priser (December 2024):**

- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

### **Kostnad per företagsanalys:**

#### Full analys (68 dimensioner):

```
Input:  68 × 8,450 tokens = 574,600 tokens
Output: 68 × 400 tokens   = 27,200 tokens

Input cost:  574,600 / 1,000,000 × $0.15 = $0.086
Output cost: 27,200 / 1,000,000 × $0.60  = $0.016

Total per analys: $0.102 (~$0.10 eller ~1 SEK)
```

#### Critical-only analys (12-14 dimensioner):

```
Input:  14 × 8,450 = 118,300 tokens
Output: 14 × 400   = 5,600 tokens

Total cost: ~$0.021 (~$0.02 eller ~0.20 SEK)
```

### **Månadsvolym exempel:**

| Analyser/mån | Full analys | Critical-only | Mix (50/50) |
| ------------ | ----------- | ------------- | ----------- |
| 100          | $10.20      | $2.10         | $6.15       |
| 500          | $51.00      | $10.50        | $30.75      |
| 1,000        | $102.00     | $21.00        | $61.50      |
| 5,000        | $510.00     | $105.00       | $307.50     |

### **Optimeringsstrategier:**

1. **Tiered Analysis:**
   - Nya användare: Critical-only ($0.02)
   - Efter engagement: Progressive (Critical → High) ($0.05)
   - Betalande kunder: Full analysis ($0.10)

2. **Content Truncation:**
   - Nuvarande: 8,000 chars (~6,000 tokens)
   - Optimerad: 4,000 chars (~3,000 tokens)
   - **Spara: ~40% input cost**

3. **Batching:**
   - Analysera flera dimensioner i samma call
   - Reducera system prompt repetition
   - **Potentiell besparing: 20-30%**

4. **Caching (GPT-4o-mini stöder prompt caching):**
   - Cache scraped content mellan dimensioner
   - **Besparing: 50% på input efter första dimensionen**

---

## 🔍 **Enhanced Scraping-verktyg & Datakällor**

### **1. Nuvarande scraping:**

```typescript
// src/lib/web-scraper.ts
- Cheerio (HTML parsing)
- Readability.js (main content extraction)
```

### **2. Föreslagna tillägg:**

#### **A. LinkedIn Company Intelligence** 🌟

```typescript
// Scrapa företagsprofil (offentlig data)
interface LinkedInCompanyData {
  employees: number;
  growth: string;
  recentHires: string[];
  keyPeople: {
    name: string;
    title: string;
    background: string;
  }[];
  companyUpdates: string[];
  specialties: string[];
}

// Implementation:
// 1. Använd Bright Data eller Apify LinkedIn scrapers
// 2. Eller: Puppeteer + stealth mode
// 3. Eller: RapidAPI LinkedIn data services
```

**Värde:** Team quality, hiring velocity, founder backgrounds

---

#### **B. Crunchbase API** 💼

```typescript
// Officiell API för startup-data
interface CrunchbaseData {
  fundingRounds: {
    date: string;
    amount: number;
    investors: string[];
    round: string;
  }[];
  totalFunding: number;
  lastFundingDate: string;
  competitors: string[];
  news: string[];
  acquisitions?: any[];
}

// Cost: $29/month (Basic) - $99/month (Pro)
```

**Värde:** Funding history, investor quality, competitive landscape

---

#### **B. SimilarWeb / Ahrefs (Traffic & SEO)** 📊

```typescript
interface TrafficData {
  monthlyVisits: number;
  trafficGrowth: string;
  topCountries: string[];
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
  };
  averageVisitDuration: string;
  bounceRate: number;
  topKeywords: string[];
  backlinks: number;
  domainRating: number;
}

// APIs:
// - SimilarWeb API: ~$200/month
// - Ahrefs API: ~$99/month
// - SEMrush API: ~$119/month
```

**Värde:** Traction signals, market demand, SEO health

---

#### **C. GitHub API (för tech companies)** 💻

```typescript
interface GitHubData {
  publicRepos: number;
  contributionActivity: number;
  teamSize: number; // active contributors
  techStack: string[];
  codeQuality: {
    hasTests: boolean;
    documentation: string;
    issueResolution: string;
  };
  developmentVelocity: {
    commits: number;
    pullRequests: number;
    releases: number;
  };
}

// Free tier: 5,000 requests/hour
```

**Värde:** Technical execution, team velocity, tech quality

---

#### **D. Product Hunt / Hacker News Scraping** 🚀

```typescript
interface CommunityData {
  productHuntLaunches: {
    upvotes: number;
    comments: number;
    rank: string;
  }[];
  hackerNewsThreads: {
    score: number;
    comments: number;
    sentiment: string;
  }[];
  redditMentions: number;
  communityEngagement: string;
}

// Implementation: Custom scraper eller APIs
```

**Värde:** Product-market fit signals, community traction

---

#### **E. Financial Data APIs** 💰

```typescript
// För publika bolag eller via integrations
interface FinancialData {
  revenue: number;
  growth: number;
  expenses: number;
  burnRate: number;
  runway: number;
  // Via integrations:
  stripeMetrics?: {
    mrr: number;
    churn: number;
    ltv: number;
  };
}

// APIs:
// - Stripe API (med user consent)
// - QuickBooks API
// - Plaid API (bank connections)
```

**Värde:** Real financial data istället för estimates

---

#### **F. G2 / Capterra Reviews** ⭐

```typescript
interface ReviewData {
  averageRating: number;
  totalReviews: number;
  recentReviews: {
    rating: number;
    title: string;
    pros: string;
    cons: string;
    date: string;
  }[];
  competitorComparisons: any[];
  categoryRanking: string;
}

// Scraping eller API access
```

**Värde:** Customer satisfaction, competitive positioning

---

#### **G. Job Boards Scraping (LinkedIn, Indeed, Glassdoor)** 👥

```typescript
interface JobBoardData {
  activeJobPostings: number;
  roles: string[];
  hiringTrends: string;
  glassdoorRating?: number;
  employeeReviews?: {
    rating: number;
    pros: string;
    cons: string;
  }[];
  salaryRanges?: any[];
}
```

**Värde:** Hiring velocity, team expansion, company culture

---

#### **H. News & Media Monitoring** 📰

```typescript
interface MediaData {
  recentArticles: {
    source: string;
    title: string;
    sentiment: string;
    date: string;
  }[];
  pressReleases: any[];
  mediaValue: string;
  tierOfCoverage: string; // Tier 1 (TechCrunch) vs Tier 3
}

// APIs:
// - NewsAPI: Free tier available
// - Bing News API: $5/1000 calls
// - Google News scraping
```

**Värde:** PR traction, market awareness, credibility

---

#### **I. Domain & Tech Stack Analysis** 🔧

```typescript
interface TechStackData {
  technologies: {
    name: string;
    category: string;
  }[];
  hosting: string;
  cdn: string;
  analytics: string[];
  marketingTools: string[];
  domainAge: string;
  sslCert: boolean;
  pageSpeed: number;
  mobileOptimized: boolean;
}

// Free tools:
// - BuiltWith API: $295/month
// - Wappalyzer: Free
// - WhatRuns (browser extension data)
```

**Värde:** Technical sophistication, scalability assessment

---

#### **J. Social Media Analytics** 📱

```typescript
interface SocialData {
  twitter: {
    followers: number;
    engagement: number;
    tweetFrequency: string;
  };
  linkedin: {
    followers: number;
    postEngagement: number;
  };
  instagram?: any;
  youtube?: {
    subscribers: number;
    views: number;
  };
  socialGrowth: string;
}

// APIs available for most platforms
```

**Värde:** Brand strength, marketing effectiveness

---

## 🎯 **Rekommenderad Implementation Roadmap**

### **Phase 1: Free/Low-cost (Månad 1)**

1. ✅ Enhanced web scraping (redan implementerat)
2. ✅ Document extraction (PDF, DOCX, etc) - implementerat
3. 🆕 LinkedIn public profile scraping
4. 🆕 GitHub API integration (free)
5. 🆕 Product Hunt scraping
6. 🆕 Domain age & SSL check

**Kostnad: $0-50/månad**

### **Phase 2: Paid APIs (Månad 2-3)**

1. Crunchbase Basic ($29/month)
2. NewsAPI ($79/month)
3. BuiltWith Lite ($295/month)

**Kostnad: ~$400/månad**

### **Phase 3: Premium Intelligence (Månad 4-6)**

1. SimilarWeb API ($200/month)
2. Ahrefs API ($99/month)
3. Review scraping (G2, Capterra)

**Kostnad: +$300/månad = ~$700/månad total**

### **Phase 4: Real-time Integrations (Månad 6+)**

1. Stripe integration (med user consent)
2. Google Analytics integration
3. QuickBooks/accounting integrations

**Kostnad: Development + API costs**

---

## 📊 **ROI Analysis**

### **Kostnad per användare:**

```
Deep Analysis (GPT-4o-mini): $0.10
Enhanced scraping (amortized): $0.20
Total per analys: $0.30

Med 1,000 analyser/månad:
- GPT cost: $100
- Data APIs: $700
- Total: $800/månad

Cost per analys: $0.80
```

### **Pricing för att vara lönsam:**

```
Freemium:
- Free tier: Critical-only ($0.02 cost)
- Upsell: Full analysis + premium data

Paid tiers:
- Basic: $49/month (3 full analyses)
- Pro: $199/month (unlimited + real-time data)
- Enterprise: $999/month (custom + integrations)

Break-even vid ~40-50 betalande kunder
```

---

## 🚀 **Quick Wins att implementera nu:**

### **1. LinkedIn Scraping (Free)**

```typescript
// src/lib/linkedin-scraper.ts
export async function scrapeLinkedInCompany(companyUrl: string) {
  // Use Puppeteer or Bright Data
  // Extract: employee count, recent hires, company updates
}
```

### **2. GitHub Integration (Free)**

```typescript
// src/lib/github-api.ts
export async function analyzeGitHubOrg(orgName: string) {
  const octokit = new Octokit();
  const repos = await octokit.repos.listForOrg({ org: orgName });
  // Analyze: activity, tech stack, team size
}
```

### **3. Traffic Estimation (Free alternative)**

```typescript
// Use: Alexa rank approximation, Cloudflare stats
// Or: Build own traffic estimator based on:
// - Backlinks (via common crawl)
// - Social mentions
// - Brand searches (Google Trends API - free)
```

### **4. Enhanced Prompt with Available Data**

```typescript
// Combine all data sources in prompt:
const enrichedPrompt = `
Company: ${businessInfo.name}
Website Traffic (estimated): ${trafficData.monthlyVisits}
GitHub Activity: ${githubData.commits} commits/month
LinkedIn Growth: ${linkedinData.employeeGrowth}
Recent Funding: ${crunchbaseData.lastRound}
Customer Reviews: ${reviewData.averageRating}/5

Analyze dimension: ${dimension.name}...
`;
```

Detta skulle ge **mycket** rikare analys för samma GPT-kostnad!

---

## 💡 **Sammanfattning:**

1. **GPT-kostnaden är låg:** ~$0.10 per full analys
2. **Största värdet:** Bättre data IN = bättre insights OUT
3. **Rekommendation:** Investera $500-1000/månad i data APIs
4. **ROI:** Mycket bättre analyskvalitet → högre conversion → snabb payback

**Next steps:**

1. Implementera LinkedIn + GitHub scraping (gratis, stor vinst)
2. Testa Crunchbase API ($29/månad)
3. Mät kvalitetsförbättring i analyser
4. Lägg till fler datakällor baserat på feedback
