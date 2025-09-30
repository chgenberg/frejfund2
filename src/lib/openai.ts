import OpenAI from 'openai';
import { BusinessInfo, BusinessAnalysisResult } from '@/types/business';
import { getOpenAIClient, getChatModel } from '@/lib/ai-client';

async function chatWithFallback(args: { messages: { role: 'system' | 'user' | 'assistant'; content: string }[]; temperature: number; maxTokens?: number }): Promise<string> {
  const model = getChatModel();
  const isGpt5 = model.startsWith('gpt-5');
  try {
    const client = getOpenAIClient();
    console.log('[DEBUG] Attempting Chat Completions with model:', model);
    const resp = await client.chat.completions.create({
      model,
      messages: args.messages,
      ...(isGpt5 ? {} : { temperature: args.temperature }),
      ...(args.maxTokens ? { max_tokens: args.maxTokens } : {})
    });
    console.log('[DEBUG] Chat Completions succeeded');
    return resp.choices[0]?.message?.content || '';
  } catch (e) {
    console.error('[DEBUG] Chat Completions failed:', e);
    // Fallback to Responses API (compatible with GPT‑5 rollout)
    try {
      console.log('[DEBUG] Attempting Responses API with model:', model);
      const client2 = getOpenAIClient();
      const r = await (client2 as any).responses.create({
        model,
        input: args.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n'),
        ...(isGpt5 ? {} : { temperature: args.temperature })
      });
      console.log('[DEBUG] Responses API succeeded');
      // SDK v5: r.output_text gives concatenated content when available
      const text = (r as any).output_text || r?.choices?.[0]?.message?.content || '';
      return text;
    } catch (e2) {
      console.error('[DEBUG] Responses API also failed:', e2);
      return '';
    }
  }
}

export class AIBusinessAnalyzer {
  private readonly systemPrompt = `You are Freja, the FrejFund Business Advisor - a world-class AI coach with personality and warmth.

CRITICAL FORMATTING RULES (MUST FOLLOW):
1. Keep responses under 800 characters (5-6 sentences)
2. ALWAYS add blank lines between paragraphs (press Enter twice)
3. ALWAYS make headers bold using **Header:**
4. NEVER write walls of text - break it up!

CONVERSATION RULES:
1. ALWAYS check context FIRST before asking questions
2. Only ask if critical info is missing from their data/website
3. If unsure about facts, confirm: "I understand that [X]. Is this correct?"
4. Give SHORT, actionable advice based on what you know
5. Use "you," "I'd," "let's"—warm and conversational

INVESTOR READINESS FRAMEWORK (guide your discovery):

Core 10:
1. Problem/solution and target customer
2. Business model and revenue streams
3. Market size and target segments
4. Team composition and why you
5. Competitors and unique advantage
6. Scalability and growth plan
7. Key risks and mitigation
8. Traction (customers, revenue, metrics)
9. Financial plan and capital use
10. Legal/regulatory (patents, licenses)

Deep dive areas (ask when relevant):
Strategy: Why now? Long-term vision? Exit strategy?
Team: Complementary skills? Skin in the game? Advisors/board?
Metrics: CAC/LTV ratio? Sales cycle? Adoption barriers?
Product: How defensible? Roadmap? Customer validation?
Finance: How much raising and why? Runway? Key KPIs? Plan B if no capital?
Risk: Model risks? Key assumptions? Dependencies (customers/suppliers)?

APPROACH:
- ALWAYS review ALL context first (website, docs, emails, KPIs)
- Base your answer on AVAILABLE DATA - don't ask for info you already have
- Only ask if CRITICAL info is truly missing
- For uncertain data: "I see that [X]. Is this correct?"
- Give focused advice (4–6 sentences MAX) based on what you know

FORMATTING:
- Use **bold** for headers ONLY
- NO asterisks in references like [1] - just write [1]
- Add blank lines (\n\n) between paragraphs
- Keep to 4–8 sentences for most answers

EXAMPLE (COPY THIS FORMAT EXACTLY):
User: "How can I grow faster?"

You: Based on your ServiceTitan integration and field service focus, here's my take.

**Growth lever:** I see you're targeting HVAC teams with 10-50 techs. Your quickest growth will come from case studies showing time savings - aim for 3 pilot customers this month.

**Action steps:** List on ServiceTitan marketplace immediately, and run targeted LinkedIn ads to dispatchers showing "save 2 hours daily" messaging.

I understand you're currently at $18k MRR with 6 customers. Is this correct?`;

  async generateChatResponse(
    message: string,
    businessInfo: BusinessInfo,
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<string> {
    try {
      const contextPrompt = `Business Context:
- Company: ${businessInfo.name}
- Stage: ${businessInfo.stage}
- Industry: ${businessInfo.industry}
- Target Market: ${businessInfo.targetMarket}
- Business Model: ${businessInfo.businessModel}
- Monthly Revenue: ${businessInfo.monthlyRevenue}
- Team Size: ${businessInfo.teamSize}
${businessInfo.website ? `- Website: ${businessInfo.website}` : ''}

User Question: ${message}

Answer as the FrejFund Business Advisor—warm, direct, coach-to-founder. 

CRITICAL FORMATTING:
- **ALWAYS USE MARKDOWN**: Bold headers with **Header Text**, bullet lists with -
- **MANDATORY LINE BREAKS**: Add TWO line breaks (\n\n) between EVERY paragraph
- **MANDATORY BOLD**: Any text before a colon should be **bold:**
- Keep responses under 800 characters (5-6 sentences)
- End with 1-2 clear questions

Example format:
Hey! Great question about growth.

First, I'd focus on your ICP. You mentioned SMBs—**narrow it down:** which vertical performs best?

**Quick wins:**
- Double down on ServiceTitan users
- Launch targeted Google Ads
- Create 2 case studies this week

**One question:** What's your current CAC and close rate from demos?`;

      let text = await chatWithFallback({
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...conversationHistory,
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.7
      });

      // Force proper formatting if GPT didn't follow instructions
      if (text && !text.includes('\n\n')) {
        // Add line breaks after sentences if missing
        text = text.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
        // Ensure headers are bold
        text = text.replace(/^([A-Z][^:]+):\s*/gm, '**$1:** ');
        text = text.replace(/\n([A-Z][^:]+):\s*/g, '\n**$1:** ');
      }

      return text || 'I apologize, but I encountered an issue generating a response. Please try again.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return 'I\'m experiencing some technical difficulties right now. Let me provide you with some general guidance based on your business context.';
    }
  }

  async generateComprehensiveAnalysis(
    businessInfo: BusinessInfo,
    websiteContent?: string,
    uploadedDocs?: string[]
  ): Promise<Partial<BusinessAnalysisResult>> {
    try {
      const analysisPrompt = `Conduct a comprehensive business analysis for this startup:

Business Information:
- Company: ${businessInfo.name}
- Stage: ${businessInfo.stage}
- Industry: ${businessInfo.industry}
- Target Market: ${businessInfo.targetMarket}
- Business Model: ${businessInfo.businessModel}
- Monthly Revenue: ${businessInfo.monthlyRevenue}
- Team Size: ${businessInfo.teamSize}
${businessInfo.website ? `- Website: ${businessInfo.website}` : ''}
${businessInfo.linkedinProfiles ? `- LinkedIn: ${businessInfo.linkedinProfiles}` : ''}

${websiteContent ? `Website Content Analysis:\n${websiteContent.slice(0, 2000)}` : ''}
${uploadedDocs ? `Document Analysis:\n${uploadedDocs.join('\n').slice(0, 2000)}` : ''}

Provide a detailed analysis with:
1. Company context summary (5 bullets)
2. Investment thesis (opportunity size, market validation, competitive advantage, scalability 1-10)
3. 3-5 actionable insights with priority, timeline, impact, and specific steps
4. Risk factors with severity and mitigation
5. Strategic recommendations (funding, milestones, team gaps, market approach)
6. Scores for: problem-solution fit, market timing, competitive moat, business model, team execution, traction, financial health (0-100)
7. Follow-up questions if needed

Format as JSON with clear structure.`;

      const content = await chatWithFallback({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3
      });
      if (!content) throw new Error('No response from OpenAI');

      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('Could not parse JSON response, using fallback');
      }

      // Fallback: parse structured text response
      return this.parseTextAnalysis(content, businessInfo);
    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      throw new Error('Failed to generate AI analysis');
    }
  }

  private parseTextAnalysis(content: string, businessInfo: BusinessInfo): Partial<BusinessAnalysisResult> {
    // Fallback parsing logic for when JSON parsing fails
    return {
      companyContext: {
        stage: businessInfo.stage,
        industry: businessInfo.industry,
        targetMarket: businessInfo.targetMarket,
        businessModel: businessInfo.businessModel,
        revenue: businessInfo.monthlyRevenue,
        team: businessInfo.teamSize
      },
      investmentThesis: {
        opportunitySize: `${businessInfo.industry} market with significant growth potential`,
        marketValidation: businessInfo.monthlyRevenue !== '0' ? 'Revenue indicates market demand' : 'Requires validation',
        competitiveAdvantage: 'Execution-dependent competitive positioning',
        scalabilityFactor: businessInfo.businessModel.toLowerCase().includes('software') ? 8 : 6
      },
      actionableInsights: [
        {
          title: 'Validate Market Demand',
          description: `Focus on validating your ${businessInfo.businessModel} approach with ${businessInfo.targetMarket}`,
          priority: 'high' as const,
          timeline: '30 days',
          expectedImpact: 'Reduce market risk by 50%',
          specificSteps: ['Conduct customer interviews', 'Analyze competitor positioning', 'Test pricing models']
        }
      ],
      riskFactors: [
        {
          risk: 'Market Competition',
          severity: 'medium' as const,
          mitigation: 'Focus on differentiation and customer retention'
        }
      ],
      scores: {
        problemSolutionFit: 65,
        marketTiming: 70,
        competitiveMoat: 60,
        businessModel: 65,
        teamExecution: 70,
        traction: businessInfo.monthlyRevenue !== '0' ? 75 : 45,
        financialHealth: 60,
        overallScore: 65
      }
    };
  }
}

export const aiAnalyzer = new AIBusinessAnalyzer();
