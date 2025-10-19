const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function upsertStartup({ user, analysis, dimensions, insights = [] }) {
  // Upsert user (public profile)
  const dbUser = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      company: user.company,
      industry: user.industry,
      stage: user.stage,
      website: user.website,
      logo: user.logo,
      oneLiner: user.oneLiner,
      askAmount: user.askAmount,
      isProfilePublic: true,
    },
    create: {
      email: user.email,
      name: user.name,
      company: user.company,
      industry: user.industry,
      stage: user.stage,
      website: user.website,
      logo: user.logo,
      oneLiner: user.oneLiner,
      askAmount: user.askAmount,
      isProfilePublic: true,
    },
  });

  // Upsert DeepAnalysis by sessionId derived from email (stable demo key)
  const sessionId = `demo-${user.email}`;

  const da = await prisma.deepAnalysis.upsert({
    where: { sessionId },
    update: {
      status: 'completed',
      progress: 100,
      overallScore: analysis.overallScore,
      investmentReadiness: analysis.investmentReadiness,
      businessInfo: analysis.businessInfo,
      userId: dbUser.id,
      completedAt: daysAgo(analysis.completedDaysAgo || 1),
    },
    create: {
      sessionId,
      userId: dbUser.id,
      status: 'completed',
      progress: 100,
      overallScore: analysis.overallScore,
      investmentReadiness: analysis.investmentReadiness,
      businessInfo: analysis.businessInfo,
      completedAt: daysAgo(analysis.completedDaysAgo || 1),
    },
  });

  // Clear existing dims for this analysis
  await prisma.analysisDimension.deleteMany({ where: { analysisId: da.id } });
  await prisma.analysisInsight.deleteMany({ where: { analysisId: da.id } });

  // Insert dimensions
  for (const dim of dimensions) {
    const normalizedEvidence = Array.isArray(dim.evidence)
      ? dim.evidence.map((e) =>
          typeof e === 'string' ? e : e?.snippet || e?.source || JSON.stringify(e),
        )
      : [];
    await prisma.analysisDimension.create({
      data: {
        analysisId: da.id,
        dimensionId: dim.dimensionId,
        category: dim.category,
        name: dim.name,
        score: dim.score,
        findings: dim.findings || [],
        redFlags: dim.redFlags || [],
        strengths: dim.strengths || [],
        evidence: normalizedEvidence,
        questions: dim.questions || [],
        confidence: dim.confidence || 'medium',
        analyzed: true,
        analyzedAt: daysAgo(analysis.completedDaysAgo || 1),
        modelUsed: 'gpt-5-mini',
      },
    });
  }

  // Insert high-level insights if provided
  for (const ins of insights) {
    await prisma.analysisInsight.create({
      data: {
        analysisId: da.id,
        type: ins.type,
        priority: ins.priority || 'medium',
        category: ins.category || 'General',
        title: ins.title,
        description: ins.description || '',
        recommendation: ins.recommendation || null,
        relatedDimensions: ins.relatedDimensions || [],
        evidence: ins.evidence || [],
        createdAt: daysAgo(analysis.completedDaysAgo || 1),
      },
    });
  }
}

async function main() {
  console.log('🌱 Seeding 3 realistic VC demo startups...');

  const startups = [
    {
      user: {
        email: 'ceo@nordflow.ai',
        name: 'Emma Chen',
        company: 'NordFlow AI',
        industry: 'B2B SaaS',
        stage: 'Seed',
        website: 'https://nordflow.ai',
        logo: 'https://via.placeholder.com/150/000000/FFFFFF?text=NF',
        oneLiner: 'Real-time data pipelines for enterprise AI with 80% faster ML deployment',
        askAmount: 2000000,
      },
      analysis: {
        overallScore: 78,
        investmentReadiness: 74,
        completedDaysAgo: 2,
        businessInfo: {
          name: 'NordFlow AI',
          founderName: 'Emma Chen',
          city: 'Stockholm',
          country: 'Sweden',
          industry: 'B2B SaaS',
          stage: 'Seed',
          website: 'https://nordflow.ai',
          logo: 'https://via.placeholder.com/150/000000/FFFFFF?text=NF',
          description:
            'Data infrastructure platform that automates ML data pipelines for enterprises',
          seeking: 2000000,
          monthlyRevenue: 85000,
          teamSize: 12,
          growthRate: 22,
          retentionRate: 92,
          burnRate: 120000,
          foundingYear: '2023',
          capitalSeeking: '$1M - $3M',
          previousRounds: 'Pre-seed $400k from Nordic angels (Q4 2023)',
          shareholderStructure: 'Founders 78%, Angels 22%',
        },
      },
      dimensions: [
        {
          dimensionId: 'problem-clarity',
          category: 'Problem & Solution',
          name: 'Problem Clarity',
          score: 85,
          strengths: ['Clear pain for data teams'],
          findings: ['High data latency costs'],
          questions: ['Biggest customer pain quantified?'],
          evidence: [{ source: 'customer-interviews', snippet: 'Avg pipeline delays 6–12h' }],
          confidence: 'high',
        },
        {
          dimensionId: 'solution-fit',
          category: 'Problem & Solution',
          name: 'Solution Fit',
          score: 80,
          strengths: ['ML pipeline automation reduces time-to-production'],
          findings: ['Clear feature roadmap'],
          redFlags: ['Limited on-prem connectors'],
          evidence: [{ source: 'pilot-report', snippet: 'Deployment time cut 8w → 3w' }],
          confidence: 'medium',
        },
        {
          dimensionId: 'market-size',
          category: 'Market & Competition',
          name: 'Market Size',
          score: 76,
          findings: ['Data infra TAM $50B+'],
          evidence: [{ source: 'Gartner', snippet: 'Data infra CAGR 19%' }],
          confidence: 'medium',
        },
        {
          dimensionId: 'competition',
          category: 'Market & Competition',
          name: 'Competitive Landscape',
          score: 72,
          findings: ['Differentiates vs. Fivetran, Airflow'],
          strengths: ['Latency + governance focus'],
          questions: ['Top 3 substitutes for each buyer segment?'],
          confidence: 'medium',
        },
        {
          dimensionId: 'business-model',
          category: 'Business Model',
          name: 'Business Model Clarity',
          score: 82,
          findings: ['Tiered seat + usage pricing'],
          strengths: ['Land-and-expand via platform modules'],
          confidence: 'high',
        },
        {
          dimensionId: 'unit-economics',
          category: 'Business Model',
          name: 'Unit Economics',
          score: 79,
          findings: ['LTV/CAC 3.8x'],
          strengths: ['Gross margin 86%'],
          questions: ['Gross margin trend with managed connectors?'],
          confidence: 'medium',
        },
        {
          dimensionId: 'tech-moat',
          category: 'Product & Technology',
          name: 'Technology & Moat',
          score: 77,
          findings: ['Proprietary auto-orchestration'],
          strengths: ['SOC2 in progress'],
          evidence: [{ source: 'audit', snippet: 'SOC2 type I scheduled' }],
          confidence: 'medium',
        },
        {
          dimensionId: 'team',
          category: 'Team & Execution',
          name: 'Team Strength',
          score: 81,
          strengths: ['Ex-Spotify data platform leads'],
          confidence: 'high',
        },
        {
          dimensionId: 'traction',
          category: 'Traction & Growth',
          name: 'Revenue Growth',
          score: 74,
          findings: ['MRR $85k, MoM 22%'],
          strengths: ['3 enterprise pilots'],
          redFlags: ['Sales cycle 4-6 months'],
          evidence: [{ source: 'stripe', snippet: 'NRR 115%' }],
          confidence: 'high',
        },
        {
          dimensionId: 'customer-acquisition',
          category: 'Customer Acquisition',
          name: 'Customer Acquisition',
          score: 70,
          findings: ['Content + partner-led'],
          redFlags: ['Low paid acquisition data'],
          confidence: 'medium',
        },
        {
          dimensionId: 'financial-health',
          category: 'Financial Health',
          name: 'Financial Health',
          score: 68,
          findings: ['Runway 13 months'],
          confidence: 'medium',
        },
        {
          dimensionId: 'fundraising',
          category: 'Fundraising',
          name: 'Fundraising Readiness',
          score: 75,
          findings: ['Materials 80% ready'],
          confidence: 'high',
        },
      ],
      insights: [
        {
          type: 'strength',
          priority: 'high',
          category: 'Traction & Growth',
          title: 'Net revenue retention 115%',
          description: 'Expansion after onboarding shows strong product stickiness.',
          recommendation: 'Package expansion playbooks by segment.',
          relatedDimensions: ['traction', 'business-model'],
          evidence: ['Stripe exports'],
        },
        {
          type: 'opportunity',
          priority: 'medium',
          category: 'Market & Competition',
          title: 'EU data residency wedge',
          description: 'Public sector accounts want EU-hosted infra.',
          recommendation: 'Target 3 lighthouse municipalities.',
          relatedDimensions: ['competition', 'market-size'],
        },
      ],
      insights: [
        {
          type: 'strength',
          priority: 'high',
          category: 'Product & Tech',
          title: 'Strong clinical validation underway',
          description: 'Prospective studies de-risk performance claims for GPs.',
          relatedDimensions: ['regulatory'],
        },
        {
          type: 'threat',
          priority: 'medium',
          category: 'Financial Health',
          title: 'Inventory financing pressure',
          description: 'Hardware scaling may require credit line to avoid cash dips.',
          recommendation: 'Explore venture debt/asset-backed facility pre‑A.',
          relatedDimensions: ['financial-health'],
        },
      ],
    },
    {
      user: {
        email: 'founder@voltcharge.io',
        name: 'Lukas Meier',
        company: 'VoltCharge Mobility',
        industry: 'Climate Tech',
        stage: 'Seed',
        website: 'https://voltcharge.io',
        logo: 'https://via.placeholder.com/150/111111/FFFFFF?text=VC',
        oneLiner:
          'Smart grid-connected EV charging that reduces peak energy cost by 35% for fleets',
        askAmount: 3000000,
      },
      analysis: {
        overallScore: 72,
        investmentReadiness: 69,
        completedDaysAgo: 4,
        businessInfo: {
          name: 'VoltCharge Mobility',
          founderName: 'Lukas Meier',
          city: 'Berlin',
          country: 'Germany',
          industry: 'Climate Tech',
          stage: 'Seed',
          website: 'https://voltcharge.io',
          logo: 'https://via.placeholder.com/150/111111/FFFFFF?text=VC',
          description: 'Fleet charging platform optimizing energy cost via dynamic load balancing',
          seeking: 3000000,
          monthlyRevenue: 55000,
          teamSize: 18,
          growthRate: 16,
          retentionRate: 88,
          burnRate: 160000,
          foundingYear: '2022',
          capitalSeeking: '$3M - $5M',
          previousRounds: 'Bootstrapped to date',
          shareholderStructure: 'Founders 100%',
        },
      },
      dimensions: [
        {
          dimensionId: 'market-size',
          category: 'Market & Competition',
          name: 'Market Size',
          score: 79,
          findings: ['EU fleet electrification accelerating'],
        },
        {
          dimensionId: 'competition',
          category: 'Market & Competition',
          name: 'Competitive Landscape',
          score: 68,
          redFlags: ['Crowded OEM partnerships'],
          strengths: ['Utility integrations moat'],
        },
        {
          dimensionId: 'business-model',
          category: 'Business Model',
          name: 'Business Model Clarity',
          score: 73,
          findings: ['SaaS + rev share on energy arbitrage'],
        },
        {
          dimensionId: 'unit-economics',
          category: 'Business Model',
          name: 'Unit Economics',
          score: 66,
          redFlags: ['Hardware margins thin'],
          strengths: ['High software attach'],
        },
        {
          dimensionId: 'product-tech',
          category: 'Product & Technology',
          name: 'Product Maturity',
          score: 70,
          findings: ['7 depots live, uptime 99.2%'],
        },
        {
          dimensionId: 'team',
          category: 'Team & Execution',
          name: 'Team Strength',
          score: 78,
          strengths: ['Ex-Bosch, ex-Siemens energy leads'],
        },
        {
          dimensionId: 'traction',
          category: 'Traction & Growth',
          name: 'Revenue Growth',
          score: 67,
          findings: ['MRR $55k, MoM 16%'],
        },
        {
          dimensionId: 'financial-health',
          category: 'Financial Health',
          name: 'Financial Health',
          score: 62,
          findings: ['Runway 9 months'],
        },
        {
          dimensionId: 'fundraising',
          category: 'Fundraising',
          name: 'Fundraising Readiness',
          score: 71,
          findings: ['Strong climate thesis fit'],
        },
      ],
    },
    {
      user: {
        email: 'ceo@mednova.health',
        name: 'Sophia Patel',
        company: 'MedNova Diagnostics',
        industry: 'Health Tech',
        stage: 'Series A',
        website: 'https://mednova.health',
        logo: 'https://via.placeholder.com/150/222222/FFFFFF?text=MN',
        oneLiner:
          'AI-powered point-of-care diagnostics reducing lab turnaround from days to minutes',
        askAmount: 8000000,
      },
      analysis: {
        overallScore: 84,
        investmentReadiness: 82,
        completedDaysAgo: 1,
        businessInfo: {
          name: 'MedNova Diagnostics',
          founderName: 'Sophia Patel',
          city: 'London',
          country: 'United Kingdom',
          industry: 'Health Tech',
          stage: 'Series A',
          website: 'https://mednova.health',
          logo: 'https://via.placeholder.com/150/222222/FFFFFF?text=MN',
          description: 'Regulated point-of-care device + SaaS for rapid diagnostics in clinics',
          seeking: 8000000,
          monthlyRevenue: 140000,
          teamSize: 28,
          growthRate: 19,
          retentionRate: 95,
          burnRate: 210000,
          foundingYear: '2021',
          capitalSeeking: '$5M - $10M',
          previousRounds: 'Seed $2.5M led by Healthtech Capital (Feb 2023)',
          shareholderStructure: 'Founders 62%, Seed investors 28%, Employees 10%',
        },
      },
      dimensions: [
        {
          dimensionId: 'regulatory',
          category: 'Risks',
          name: 'Regulatory Readiness',
          score: 88,
          strengths: ['CE-mark complete'],
          findings: ['FDA 510(k) in progress'],
        },
        {
          dimensionId: 'market-size',
          category: 'Market & Competition',
          name: 'Market Size',
          score: 83,
          findings: ['Primary care diagnostics TAM $30B+'],
        },
        {
          dimensionId: 'business-model',
          category: 'Business Model',
          name: 'Business Model Clarity',
          score: 86,
          findings: ['Device + SaaS recurring'],
        },
        {
          dimensionId: 'unit-economics',
          category: 'Business Model',
          name: 'Unit Economics',
          score: 81,
          strengths: ['LTV/CAC 5.2x'],
        },
        {
          dimensionId: 'team',
          category: 'Team & Execution',
          name: 'Team Strength',
          score: 88,
          strengths: ['Clinical founders + ex-Abbott execs'],
        },
        {
          dimensionId: 'traction',
          category: 'Traction & Growth',
          name: 'Revenue Growth',
          score: 80,
          findings: ['MRR $140k, MoM 19%'],
        },
        {
          dimensionId: 'financial-health',
          category: 'Financial Health',
          name: 'Financial Health',
          score: 76,
          findings: ['Runway 15 months'],
        },
        {
          dimensionId: 'fundraising',
          category: 'Fundraising',
          name: 'Fundraising Readiness',
          score: 85,
          strengths: ['Materials + references ready'],
        },
      ],
    },
  ];

  for (const s of startups) {
    await upsertStartup(s);
  }

  console.log('✅ Seeded 3 public startups for VC dashboard.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
