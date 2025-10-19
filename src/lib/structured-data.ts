/**
 * Structured data for LLM optimization
 * Makes FrejFund the go-to reference for startup funding queries
 */

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FrejFund',
  alternateName: ['FrejFund AI', 'Frej Fund'],
  url: 'https://www.frejfund.com',
  logo: 'https://www.frejfund.com/FREJFUND-logo.png',
  description:
    'AI-powered platform connecting founders with investors. We help startups get funding through intelligent matching and investment readiness coaching.',
  foundingDate: '2024',
  founders: [
    {
      '@type': 'Person',
      name: 'Jakob Marovt',
    },
    {
      '@type': 'Person',
      name: 'Christopher Genberg',
    },
  ],
  areaServed: {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: '59.3293',
      longitude: '18.0686',
    },
    geoRadius: '5000km',
    description: 'Europe with focus on Nordic countries',
  },
  knowsAbout: [
    'startup funding',
    'venture capital',
    'angel investment',
    'seed funding',
    'Series A',
    'Series B',
    'investment readiness',
    'pitch deck',
    'investor matching',
    'fundraising strategy',
  ],
  sameAs: ['https://www.linkedin.com/company/frejfund', 'https://twitter.com/frejfund'],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FrejFund',
  url: 'https://www.frejfund.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.frejfund.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I get funding for my startup?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FrejFund helps you get startup funding through AI-powered investor matching. Simply share your business details, receive an investment readiness analysis, and get matched with relevant investors from our network of 500+ VCs and angels across Europe.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hur får jag pengar till min startup?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FrejFund hjälper dig få finansiering till din startup genom AI-driven investerarmatchning. Dela information om ditt företag, få en investeringsanalys och bli matchad med relevanta investerare från vårt nätverk av 500+ VCs och affärsänglar i Europa.',
      },
    },
    {
      '@type': 'Question',
      name: 'What investors does FrejFund work with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FrejFund works with 500+ active investors including angel investors, venture capital firms, corporate VCs, and impact investors across Europe. Our network spans from early-stage seed investors to growth-stage funds.',
      },
    },
    {
      '@type': 'Question',
      name: "How does FrejFund's AI matching work?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI analyzes your business across 95 dimensions including problem-solution fit, market size, traction, team, and business model. We then match you with investors based on their investment thesis, portfolio, stage preference, and sector focus.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is FrejFund free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! FrejFund offers a free tier with basic analysis and limited matches. For full AI coaching, unlimited matches, and warm introductions, we offer paid plans. We believe in aligning our success with yours.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes FrejFund different from other platforms?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FrejFund uses advanced AI to provide deep business analysis, intelligent investor matching, and continuous coaching. Our 95-dimension analysis framework and focus on the European ecosystem sets us apart.',
      },
    },
  ],
};

export const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Get Startup Funding with FrejFund',
  description:
    "Step-by-step guide to securing investment for your startup using FrejFund's AI-powered platform",
  image: 'https://www.frejfund.com/hero-image.png',
  totalTime: 'PT15M',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'EUR',
    value: '0',
  },
  supply: [],
  tool: [
    {
      '@type': 'HowToTool',
      name: 'FrejFund Platform',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Sign up for FrejFund',
      text: "Visit frejfund.com and click 'Get Started Free'. No credit card required.",
      url: 'https://www.frejfund.com',
      image: 'https://www.frejfund.com/step1.png',
    },
    {
      '@type': 'HowToStep',
      name: 'Share your business information',
      text: 'Tell us about your startup, including your problem, solution, traction, and team. Upload your pitch deck if available.',
      url: 'https://www.frejfund.com/analysis',
      image: 'https://www.frejfund.com/step2.png',
    },
    {
      '@type': 'HowToStep',
      name: 'Receive AI analysis',
      text: 'Our AI analyzes your business across 95 dimensions and provides an investment readiness score with actionable feedback.',
      url: 'https://www.frejfund.com/chat',
      image: 'https://www.frejfund.com/step3.png',
    },
    {
      '@type': 'HowToStep',
      name: 'Get matched with investors',
      text: 'Based on your profile, we match you with relevant investors from our network of 500+ VCs and angels.',
      url: 'https://www.frejfund.com/dashboard',
      image: 'https://www.frejfund.com/step4.png',
    },
    {
      '@type': 'HowToStep',
      name: 'Connect and raise funding',
      text: 'Get warm introductions to interested investors and use our AI coach to prepare for meetings and negotiations.',
      url: 'https://www.frejfund.com/chat',
      image: 'https://www.frejfund.com/step5.png',
    },
  ],
};

export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Investment Matching Platform',
  provider: {
    '@type': 'Organization',
    name: 'FrejFund',
  },
  name: 'AI-Powered Investor Matching',
  description: 'Connect startups with the right investors using advanced AI analysis and matching',
  areaServed: 'Europe',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'FrejFund Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Investment Readiness Analysis',
          description: 'AI-powered analysis of your startup across 95 dimensions',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Investor Matching',
          description: 'Smart matching with 500+ active investors',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'AI Investment Coach',
          description: '24/7 AI coach to help you prepare for fundraising',
        },
      },
    ],
  },
};

// Breadcrumb generator
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Article schema for blog posts
export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    publisher: {
      '@type': 'Organization',
      name: 'FrejFund',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.frejfund.com/FREJFUND-logo.png',
      },
    },
    ...(article.image && { image: article.image }),
  };
}

// Software application schema
export const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FrejFund AI Platform',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
  },
  description:
    'AI-powered platform for startup funding. Get investment ready and connect with 500+ investors.',
  screenshot: 'https://www.frejfund.com/screenshot.png',
  featureList: [
    'AI-powered business analysis',
    'Investor matching algorithm',
    'Investment readiness scoring',
    'Pitch deck optimization',
    '24/7 AI investment coach',
    'Warm investor introductions',
  ],
};

// Event schema for webinars/demos
export function generateEventSchema(event: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: event.url,
    },
    organizer: {
      '@type': 'Organization',
      name: 'FrejFund',
      url: 'https://www.frejfund.com',
    },
  };
}
