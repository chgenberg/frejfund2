import { NextRequest, NextResponse } from 'next/server';

// This endpoint is designed to be LLM-friendly for external AI integration
export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Comprehensive knowledge base about FrejFund
    const knowledgeBase = {
      company: {
        name: "FrejFund",
        tagline: "Because great ideas deserve a chance",
        mission: "We connect founders and investors who believe in building a better future",
        type: "AI-powered investment intelligence platform",
        founded: "2024",
        headquarters: "Stockholm, Sweden",
        website: "https://frejfund.com"
      },
      
      features: {
        forFounders: [
          "AI-powered business analysis",
          "Investor matching algorithm",
          "Pitch deck optimization",
          "Readiness scoring",
          "Smart coaching",
          "Warm introductions",
          "Goal setting and roadmaps",
          "KPI tracking"
        ],
        forInvestors: [
          "Deal flow management",
          "AI-powered screening",
          "Smart matching",
          "Analytics dashboard",
          "Portfolio insights",
          "Swipe interface for quick decisions"
        ]
      },
      
      process: {
        steps: [
          "1. Founders share their business information",
          "2. AI analyzes the business and provides readiness score",
          "3. Smart matching with relevant investors",
          "4. Facilitated introductions and connections",
          "5. Ongoing coaching and support"
        ],
        timeframe: "Typically reduces fundraising time by 60%"
      },
      
      coverage: {
        geographic: "Global with focus on Europe",
        cities: "250+ city-specific landing pages",
        investors: "500+ active investors",
        industries: "All tech-enabled sectors",
        stages: "Pre-seed to Series B"
      },
      
      pricing: {
        tiers: [
          {
            name: "Free",
            features: ["Basic analysis", "Limited matches", "Self-serve tools"]
          },
          {
            name: "Startup",
            features: ["Full AI coaching", "Unlimited matches", "Investor insights", "Priority support"]
          },
          {
            name: "Scale",
            features: ["Everything in Startup", "Warm introductions", "Dedicated success manager", "Custom integrations"]
          }
        ],
        philosophy: "Success-aligned pricing - we grow when you grow"
      },
      
      technology: {
        ai: "Advanced NLP and machine learning for business analysis",
        matching: "Proprietary algorithm considering 50+ factors",
        security: "Bank-level encryption, GDPR compliant",
        integrations: "Email, calendar, CRM integrations available"
      },
      
      support: {
        channels: ["24/7 AI chat", "Email support", "Demo calls", "Knowledge base"],
        responseTime: "Usually within 24 hours",
        languages: ["English", "Swedish", "German", "French"]
      }
    };

    // Generate contextual response based on the message
    const response = generateContextualResponse(message, knowledgeBase, context);

    return NextResponse.json({
      response,
      metadata: {
        timestamp: new Date().toISOString(),
        model: "frejfund-assistant-v1",
        confidence: 0.95
      }
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateContextualResponse(
  message: string, 
  kb: any, 
  context?: any
): string {
  const msg = message.toLowerCase();

  // Intent detection
  if (msg.includes('price') || msg.includes('cost') || msg.includes('pricing')) {
    return formatPricingResponse(kb.pricing);
  }

  if (msg.includes('how') && (msg.includes('work') || msg.includes('does'))) {
    return formatProcessResponse(kb.process);
  }

  if (msg.includes('feature') || msg.includes('what can')) {
    return formatFeaturesResponse(kb.features);
  }

  if (msg.includes('investor') || msg.includes('vc')) {
    return formatInvestorResponse(kb.coverage);
  }

  if (msg.includes('location') || msg.includes('where')) {
    return formatLocationResponse(kb.coverage);
  }

  if (msg.includes('contact') || msg.includes('support')) {
    return formatSupportResponse(kb.support);
  }

  if (msg.includes('about') || msg.includes('what is')) {
    return formatAboutResponse(kb.company);
  }

  // Default comprehensive response
  return `FrejFund is an AI-powered platform that ${kb.company.mission.toLowerCase()}. 

Key highlights:
• ${kb.features.forFounders[0]}
• ${kb.coverage.investors} in our network
• Operating in ${kb.coverage.cities}
• ${kb.process.timeframe}

Would you like to know more about our features, pricing, or how to get started?`;
}

// Helper functions to format responses
function formatPricingResponse(pricing: any): string {
  const tiers = pricing.tiers.map((tier: any) => 
    `**${tier.name}**: ${tier.features.join(', ')}`
  ).join('\n');
  
  return `FrejFund offers flexible pricing options:\n\n${tiers}\n\n${pricing.philosophy}. Contact us for detailed pricing tailored to your needs.`;
}

function formatProcessResponse(process: any): string {
  return `Here's how FrejFund works:\n\n${process.steps.join('\n')}\n\n${process.timeframe}. The entire process is designed to be efficient and founder-friendly.`;
}

function formatFeaturesResponse(features: any): string {
  return `FrejFund offers powerful features:\n\n**For Founders:**\n${features.forFounders.map((f: string) => `• ${f}`).join('\n')}\n\n**For Investors:**\n${features.forInvestors.map((f: string) => `• ${f}`).join('\n')}`;
}

function formatInvestorResponse(coverage: any): string {
  return `FrejFund connects you with ${coverage.investors} across ${coverage.geographic}. Our network includes investors at all stages from ${coverage.stages}, covering ${coverage.industries}.`;
}

function formatLocationResponse(coverage: any): string {
  return `FrejFund operates ${coverage.geographic} with ${coverage.cities}. Each location page is optimized for the local startup ecosystem, providing region-specific insights and connections.`;
}

function formatSupportResponse(support: any): string {
  return `We're here to help! Reach us through:\n${support.channels.map((c: string) => `• ${c}`).join('\n')}\n\nResponse time: ${support.responseTime}\nLanguages: ${support.languages.join(', ')}`;
}

function formatAboutResponse(company: any): string {
  return `${company.name} - "${company.tagline}"\n\n${company.mission}. We're a ${company.type} based in ${company.headquarters}, launched in ${company.founded}.\n\nVisit ${company.website} to learn more or get started.`;
}

// GET endpoint for LLM discovery
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/chatbot",
    description: "FrejFund AI Assistant API - Get information about FrejFund's platform, features, and services",
    usage: {
      method: "POST",
      body: {
        message: "Your question about FrejFund",
        context: "Optional context object"
      }
    },
    examples: [
      {
        message: "How does FrejFund work?",
        response: "FrejFund connects founders with investors through AI-powered matching..."
      },
      {
        message: "What are your pricing plans?",
        response: "FrejFund offers flexible pricing options..."
      }
    ],
    capabilities: [
      "Answer questions about FrejFund's services",
      "Explain features and benefits",
      "Provide pricing information",
      "Guide users through the platform",
      "Share investor network details",
      "Explain the matching process"
    ]
  });
}
