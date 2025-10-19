export const demoCompany = {
  name: 'FlowOpt',
  email: 'founder@flowopt.ai',
  website: 'https://demo.flowopt.ai',
  linkedinProfiles: '',
  stage: 'early-revenue',
  industry: 'SaaS',
  targetMarket: 'SMBs',
  businessModel: 'B2B Subscription',
  monthlyRevenue: '18000',
  teamSize: '6-10',
} as const;

export const demoWebsiteText = `Smarter schedules. Happier customers.
FlowOpt uses AI to plan and optimize every field visit, saving hours each week and boosting revenue.

Features:
- Automatic route optimization with live traffic data
- Predictive job duration powered by AI
- One-click rescheduling for last-minute changes
- Customer SMS updates & feedback collection
- Integrations with ServiceTitan, Zapier, QuickBooks

About:
FlowOpt was founded in 2024 to solve one of the biggest headaches in field service: inefficient scheduling.`;

export const demoEmails = [
  {
    subject: 'FlowOpt Update – Metrics & Deck',
    from: 'anna@flowopt.ai',
    to: 'investors@vcfund.com',
    date: '2025-07-05',
    body: "We've grown MRR from $12k in April to $21k in July, CAC ~$350, churn ~5% monthly. 72 active customers, ARPA ~$292.",
  },
  {
    subject: 'Scheduling feels clunky',
    from: 'tom@hvacsolutions.com',
    to: 'support@flowopt.ai',
    date: '2025-06-18',
    body: 'Rescheduling after last-minute cancels sometimes pushes jobs too far; dispatch does manual fixes.',
  },
  {
    subject: 'Pipeline & Roadmap Q3',
    from: 'anna@flowopt.ai',
    to: 'team@flowopt.ai',
    date: '2025-07-01',
    body: 'Closed 12 in June (72 total). Mobile app end of July. Q3 goal $30k MRR, churn <5%.',
  },
] as const;

export const demoKpiCsv = `date,mrr,new_customers,churned_customers,arpa,cac,marketing_spend
2025-04,12000,24,6,200,350,8000
2025-05,15000,30,8,208,360,9000
2025-06,18200,34,9,210,345,9500
2025-07,21000,32,10,292,355,10000
2025-08,23500,28,9,294,340,9800
2025-09,26000,30,8,295,345,10200
2025-10,28000,26,7,296,350,10500
2025-11,30000,25,7,297,360,11000
2025-12,32500,28,8,298,355,11200
2026-01,35000,30,9,299,345,11500
2026-02,37500,32,9,300,340,11800
2026-03,40000,34,10,301,350,12000`;
