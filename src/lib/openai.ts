import OpenAI from 'openai';
import { BusinessInfo, BusinessAnalysisResult } from '@/types/business';
import { getOpenAIClient, getChatModel, TaskComplexity } from '@/lib/ai-client';

async function chatWithFallback(args: { messages: { role: 'system' | 'user' | 'assistant'; content: string }[]; temperature: number; maxTokens?: number; complexity?: TaskComplexity }): Promise<string> {
  const model = getChatModel(args.complexity || 'simple');
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
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>,
    sessionId?: string
  ): Promise<string> {
    try {
      // Check if user is asking about investors
      const investorKeywords = [
        'investor', 'investerare', 'vc', 'venture capital',
        'pitch', 'funding', 'finansiering', 'raise', 'söka kapital',
        'contact', 'kontakta', 'reach out'
      ];
      
      const emailKeywords = [
        'email', 'mejl', 'draft', 'write', 'skriv', 'intro', 'introduction',
        'reach out', 'contact', 'message', 'meddelande'
      ];
      
      const warmIntroKeywords = [
        'warm intro', 'introduction', 'mutual connection', 'know anyone',
        'känner någon', 'gemensam kontakt', 'warm introduction'
      ];
      
      const isAskingAboutInvestors = investorKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      const isAskingForEmail = emailKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );
      
      // If asking about investors and we have a session, trigger matching
      if (isAskingAboutInvestors && sessionId) {
        try {
          const response = await fetch('/api/investors/match', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-session-id': sessionId
            },
            body: JSON.stringify({ 
              businessInfo: {
                name: businessInfo.name,
                industry: businessInfo.industry,
                stage: businessInfo.stage,
                targetMarket: businessInfo.targetMarket,
                businessModel: businessInfo.businessModel
              },
              limit: 5
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const matches = data.matches || [];
            
            if (matches.length > 0) {
              // Format investor recommendations
              let investorResponse = `Based on your profile (${businessInfo.industry}, ${businessInfo.stage} stage), here are your **top investor matches**:\n\n`;
              
              matches.slice(0, 3).forEach((match: any, idx: number) => {
                const checkRange = match.investor.checkSizeMin && match.investor.checkSizeMax
                  ? `$${(match.investor.checkSizeMin / 1000000).toFixed(1)}M-$${(match.investor.checkSizeMax / 1000000).toFixed(1)}M`
                  : 'varies';
                
                investorResponse += `**${idx + 1}. ${match.investor.firmName || match.investor.name}** (${match.matchScore}% match)\n`;
                investorResponse += `${match.reasoning}\n`;
                investorResponse += `• Check size: ${checkRange}\n`;
                investorResponse += `• Portfolio: ${match.investor.notableInvestments?.slice(0, 2).join(', ')}\n\n`;
              });
              
              investorResponse += `I've saved these matches for you. Want me to draft intro emails?\n\n`;
              investorResponse += `💡 Just ask: "Draft email to Creandum" or "Write intro email to ${matches[0].investor.firmName}"`;
              
              return investorResponse;
            }
          }
        } catch (error) {
          console.error('Error fetching investor matches:', error);
          // Continue with normal response if matching fails
        }
      }
      
      // Check if user wants an email draft
      if (isAskingForEmail && (isAskingAboutInvestors || message.toLowerCase().includes('draft'))) {
        try {
          // Extract investor name from message
          const investorNameMatch = message.match(/(?:to|för|med)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|$|\.|\?)/);
          const investorName = investorNameMatch ? investorNameMatch[1].trim() : null;
          
          if (investorName && sessionId) {
            // Find investor in saved matches or database
            const matchesResponse = await fetch('/api/investors/match', {
              headers: { 'x-session-id': sessionId }
            });
            
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json();
              const targetMatch = matchesData.matches?.find((m: any) => 
                m.investor.firmName.toLowerCase().includes(investorName.toLowerCase()) ||
                m.investor.name.toLowerCase().includes(investorName.toLowerCase())
              );
              
              if (targetMatch) {
                // Generate email
                const emailResponse = await fetch('/api/investors/email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    investorId: targetMatch.investor.id,
                    businessInfo,
                    emailType: 'cold_outreach'
                  })
                });
                
                if (emailResponse.ok) {
                  const emailData = await emailResponse.json();
                  
                  let emailDraft = `Here's a personalized email draft for **${targetMatch.investor.firmName}**:\n\n`;
                  emailDraft += `**Subject:** ${emailData.email.subject}\n\n`;
                  emailDraft += `**Body:**\n${emailData.email.body}\n\n`;
                  emailDraft += `**✨ Tips:**\n`;
                  emailData.email.tips.forEach((tip: string) => {
                    emailDraft += `${tip}\n`;
                  });
                  
                  if (emailData.email.subjectVariations && emailData.email.subjectVariations.length > 0) {
                    emailDraft += `\n**Alternative subject lines:**\n`;
                    emailData.email.subjectVariations.slice(0, 3).forEach((subject: string, i: number) => {
                      emailDraft += `${i + 1}. ${subject}\n`;
                    });
                  }
                  
                  emailDraft += `\nWant me to revise anything?`;
                  
                  return emailDraft;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error generating email draft:', error);
          // Continue with normal response if email generation fails
        }
      }
      
      // Check if user wants warm intro guidance
      const isAskingForWarmIntro = warmIntroKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );
      
      if (isAskingForWarmIntro && isAskingAboutInvestors) {
        try {
          // Extract investor name
          const investorNameMatch = message.match(/(?:to|för|med)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|$|\.|\?)/);
          const investorName = investorNameMatch ? investorNameMatch[1].trim() : 'the investor';
          
          const { generateWarmIntroGuidance } = await import('./warm-intro-simple');
          const guidance = await generateWarmIntroGuidance(investorName, investorName);
          
          return guidance;
        } catch (error) {
          console.error('Error generating warm intro guidance:', error);
        }
      }
      
      // Import coaching prompts and goal system
      const { calculateReadinessScore, getCoachingSystemPrompt } = await import('./coaching-prompts');
      const { getCurrentMilestone } = await import('./goal-system');
      
      // Calculate readiness score
      const readiness = calculateReadinessScore(businessInfo);
      
      // Get user goal and roadmap from localStorage
      let userGoal: string | undefined;
      let currentMilestone: string | undefined;
      
      if (typeof window !== 'undefined') {
        const goalId = localStorage.getItem('frejfund-goal');
        const customGoal = localStorage.getItem('frejfund-custom-goal');
        const roadmapStr = localStorage.getItem('frejfund-roadmap');
        
        if (goalId) {
          const { GOAL_OPTIONS } = await import('./goal-system');
          const goalOption = GOAL_OPTIONS.find(g => g.id === goalId);
          userGoal = goalId === 'custom' ? customGoal || 'Custom goal' : goalOption?.title;
        }
        
        if (roadmapStr) {
          const roadmap = JSON.parse(roadmapStr);
          const milestone = getCurrentMilestone(roadmap);
          if (milestone) {
            currentMilestone = milestone.title;
          }
        }
      }
      
      // Get coaching system prompt with goal awareness
      const coachingSystemPrompt = getCoachingSystemPrompt(
        businessInfo, 
        readiness.score,
        userGoal,
        currentMilestone
      );
      
      const contextPrompt = `User Question: ${message}`;

      let text = await chatWithFallback({
        messages: [
          { role: 'system', content: coachingSystemPrompt },
          ...conversationHistory,
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.7,
        complexity: 'simple' // Use mini model for regular chat
      });

      // Clean up excessive line breaks
      if (text) {
        // Remove triple+ line breaks, keep max double
        text = text.replace(/\n{3,}/g, '\n\n');
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
        temperature: 0.3,
        complexity: 'complex' // Use full model for deep business analysis
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
