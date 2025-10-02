import { getOpenAIClient, getChatModel } from './ai-client';
import { BusinessInfo } from '@/types/business';

// Core framework areas that MUST be covered
export const CORE_DISCOVERY_AREAS = [
  'business_idea',      // Always ask first
  'business_model',     // Always ask
  'team',              // Always ask
  'market_traction',   // Always ask
  'funding_stage'      // Always ask
] as const;

export interface IntelligentQuestion {
  id: string;
  question: string;
  type: 'fixed' | 'dynamic';
  area: string;
  reasoning?: string; // Why this question now
  followUpContext?: string; // What we're trying to discover
}

export interface ConversationState {
  questionsAsked: IntelligentQuestion[];
  answersGiven: Array<{ question: string; answer: string }>;
  knownFacts: string[];
  areasToExplore: string[];
  confidenceScore: number; // 0-100, how confident we are in our understanding
  currentFocusArea: string;
}

// Fixed questions that always get asked (5 core questions)
const FIXED_QUESTIONS: Record<string, string> = {
  business_idea: "Tell me about your business idea in a few sentences. What problem are you solving, and for whom?",
  business_model: "How do you make money? What's your business model?",
  team: "Tell me about your team. Who are the founders and what relevant experience do you bring?",
  market_traction: "What traction do you have so far? (customers, revenue, pilots, waitlist, etc.)",
  funding_stage: "What's your current funding situation and what are your plans?"
};

export class IntelligentSearchEngine {
  private openai = getOpenAIClient();
  private maxQuestions = 10;
  private fixedQuestionCount = 5;
  
  /**
   * Initialize a new intelligent search conversation
   */
  initializeConversation(businessInfo: BusinessInfo): ConversationState {
    return {
      questionsAsked: [],
      answersGiven: [],
      knownFacts: this.extractInitialFacts(businessInfo),
      areasToExplore: [
        'competitive_advantage',
        'scalability',
        'key_risks',
        'go_to_market',
        'product_roadmap',
        'customer_validation',
        'unit_economics',
        'regulatory_considerations'
      ],
      confidenceScore: 20, // Low confidence at start
      currentFocusArea: 'business_idea'
    };
  }
  
  /**
   * Extract what we already know from initial business info
   */
  private extractInitialFacts(businessInfo: BusinessInfo): string[] {
    const facts: string[] = [];
    
    if (businessInfo.industry) facts.push(`Industry: ${businessInfo.industry}`);
    if (businessInfo.stage) facts.push(`Stage: ${businessInfo.stage}`);
    if (businessInfo.targetMarket) facts.push(`Target market: ${businessInfo.targetMarket}`);
    if (businessInfo.monthlyRevenue) facts.push(`Monthly revenue: ${businessInfo.monthlyRevenue}`);
    if (businessInfo.teamSize) facts.push(`Team size: ${businessInfo.teamSize}`);
    
    return facts;
  }
  
  /**
   * Get the next question to ask
   * Returns fixed question if we haven't covered core areas, otherwise generates dynamic question
   */
  async getNextQuestion(state: ConversationState, businessInfo: BusinessInfo): Promise<IntelligentQuestion | null> {
    // If we've hit max questions, stop
    if (state.questionsAsked.length >= this.maxQuestions) {
      return null;
    }
    
    // First 5 questions: Ask fixed core questions in order
    if (state.questionsAsked.length < this.fixedQuestionCount) {
      const coreArea = CORE_DISCOVERY_AREAS[state.questionsAsked.length];
      const question = FIXED_QUESTIONS[coreArea];
      
      return {
        id: `fixed-${coreArea}`,
        question,
        type: 'fixed',
        area: coreArea,
        reasoning: 'Core discovery question'
      };
    }
    
    // Questions 6-10: Generate dynamic follow-up questions based on previous answers
    return this.generateDynamicQuestion(state, businessInfo);
  }
  
  /**
   * Generate a dynamic follow-up question based on conversation so far
   */
  private async generateDynamicQuestion(
    state: ConversationState, 
    businessInfo: BusinessInfo
  ): Promise<IntelligentQuestion | null> {
    try {
      // Build context from conversation
      const conversationContext = state.answersGiven
        .map(qa => `Q: ${qa.question}\nA: ${qa.answer}`)
        .join('\n\n');
      
      const knownFactsStr = state.knownFacts.join('\n');
      const areasToExploreStr = state.areasToExplore.join(', ');
      
      const prompt = `You are conducting an intelligent business discovery interview. Based on the conversation so far, generate THE MOST VALUABLE next question.

CONVERSATION SO FAR:
${conversationContext}

KNOWN FACTS:
${knownFactsStr}

AREAS STILL TO EXPLORE:
${areasToExploreStr}

CRITICAL REQUIREMENTS:
1. Ask a SPECIFIC follow-up question that builds on their previous answers
2. Focus on uncovering critical unknowns about business viability
3. The question should feel natural and conversational (not robotic)
4. Dig deeper into areas that seem promising or risky based on their answers
5. Don't repeat information they've already provided

Generate a single, highly targeted question that would help us understand:
- Investment readiness
- Market opportunity
- Founder capability
- Business scalability

Respond with ONLY the question text (no preamble, no "Question:", just the question).`;

      const response = await this.openai.chat.completions.create({
        model: getChatModel('simple'),
        messages: [
          { role: 'system', content: 'You are an expert business advisor conducting investor due diligence.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      
      const questionText = response.choices[0]?.message?.content?.trim() || '';
      
      if (!questionText) return null;
      
      // Infer which area this question is exploring
      const area = this.inferQuestionArea(questionText, state.areasToExplore);
      
      return {
        id: `dynamic-${Date.now()}`,
        question: questionText,
        type: 'dynamic',
        area: area || 'general',
        reasoning: 'Generated based on previous answers',
        followUpContext: `Exploring ${area || 'business context'} in more depth`
      };
    } catch (error) {
      console.error('Error generating dynamic question:', error);
      
      // Fallback to a smart default question
      return this.getFallbackQuestion(state);
    }
  }
  
  /**
   * Infer which area a dynamically generated question is exploring
   */
  private inferQuestionArea(question: string, areasToExplore: string[]): string | null {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('compet') || lowerQ.includes('different')) return 'competitive_advantage';
    if (lowerQ.includes('scale') || lowerQ.includes('grow')) return 'scalability';
    if (lowerQ.includes('risk') || lowerQ.includes('challenge')) return 'key_risks';
    if (lowerQ.includes('customer') || lowerQ.includes('market') || lowerQ.includes('acquisition')) return 'go_to_market';
    if (lowerQ.includes('product') || lowerQ.includes('feature') || lowerQ.includes('roadmap')) return 'product_roadmap';
    if (lowerQ.includes('valid') || lowerQ.includes('test') || lowerQ.includes('proof')) return 'customer_validation';
    if (lowerQ.includes('cost') || lowerQ.includes('margin') || lowerQ.includes('unit') || lowerQ.includes('cac') || lowerQ.includes('ltv')) return 'unit_economics';
    if (lowerQ.includes('regulat') || lowerQ.includes('legal') || lowerQ.includes('compliance')) return 'regulatory_considerations';
    
    return areasToExplore[0] || 'general';
  }
  
  /**
   * Fallback question if AI generation fails
   */
  private getFallbackQuestion(state: ConversationState): IntelligentQuestion {
    const fallbackQuestions: Record<string, string> = {
      competitive_advantage: "What makes your solution unique compared to existing alternatives?",
      scalability: "How will you scale this business beyond your first 100 customers?",
      key_risks: "What's the biggest risk to your business right now, and how are you addressing it?",
      go_to_market: "How are you planning to acquire your first 1000 customers?",
      product_roadmap: "What are your product development priorities for the next 6 months?",
      customer_validation: "How have you validated that customers actually want this solution?",
      unit_economics: "What's your customer acquisition cost and expected lifetime value?",
      regulatory_considerations: "Are there any regulatory or legal hurdles you need to navigate?"
    };
    
    const area = state.areasToExplore[0] || 'competitive_advantage';
    const question = fallbackQuestions[area] || "What else should I know about your business?";
    
    return {
      id: `fallback-${Date.now()}`,
      question,
      type: 'dynamic',
      area,
      reasoning: 'Fallback question'
    };
  }
  
  /**
   * Process an answer and update conversation state
   */
  async processAnswer(
    state: ConversationState,
    question: IntelligentQuestion,
    answer: string,
    businessInfo: BusinessInfo
  ): Promise<ConversationState> {
    // Add Q&A to history
    state.answersGiven.push({
      question: question.question,
      answer
    });
    
    state.questionsAsked.push(question);
    
    // Extract new facts from answer using AI
    const newFacts = await this.extractFactsFromAnswer(answer, question.area);
    state.knownFacts.push(...newFacts);
    
    // Remove explored area from future exploration
    state.areasToExplore = state.areasToExplore.filter(a => a !== question.area);
    
    // Increase confidence as we learn more
    state.confidenceScore = Math.min(100, state.confidenceScore + 8);
    
    // Update current focus area for next question
    state.currentFocusArea = this.determineNextFocusArea(state);
    
    return state;
  }
  
  /**
   * Extract structured facts from a user's answer
   */
  private async extractFactsFromAnswer(answer: string, area: string): Promise<string[]> {
    try {
      const prompt = `Extract 2-3 key facts from this answer about a business:

Area: ${area}
Answer: ${answer}

Respond with a JSON array of strings, each being one concise fact.
Example: ["They have 50 paying customers", "Monthly revenue is $10k", "Growing 20% MoM"]`;

      const response = await this.openai.chat.completions.create({
        model: getChatModel('simple'),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      });
      
      const content = response.choices[0]?.message?.content?.trim() || '[]';
      const facts = JSON.parse(content);
      
      return Array.isArray(facts) ? facts : [];
    } catch (error) {
      console.error('Error extracting facts:', error);
      // Fallback: just use the answer as-is (truncated)
      return [answer.slice(0, 200)];
    }
  }
  
  /**
   * Determine what area to focus on next
   */
  private determineNextFocusArea(state: ConversationState): string {
    // Priority: areas we haven't explored yet
    if (state.areasToExplore.length > 0) {
      return state.areasToExplore[0];
    }
    
    // If we've covered everything, focus on deepening understanding
    return 'general';
  }
  
  /**
   * Check if we have enough information to generate a comprehensive analysis
   */
  isReadyForAnalysis(state: ConversationState): boolean {
    return state.questionsAsked.length >= this.maxQuestions || state.confidenceScore >= 80;
  }
  
  /**
   * Generate final analysis based on all gathered information
   */
  async generateFinalAnalysis(state: ConversationState, businessInfo: BusinessInfo): Promise<string> {
    const conversationContext = state.answersGiven
      .map(qa => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join('\n\n');
    
    const prompt = `Based on this detailed business discovery conversation, provide a comprehensive 3-paragraph analysis:

CONVERSATION:
${conversationContext}

KNOWN FACTS:
${state.knownFacts.join('\n')}

Provide:
1. **Summary**: What is this business and what makes it interesting?
2. **Strengths & Opportunities**: Key competitive advantages and market opportunities
3. **Risks & Recommendations**: Major concerns and actionable next steps

Keep it concise but insightful. Use **bold** for key points.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: getChatModel('simple'),
        messages: [
          { role: 'system', content: 'You are a world-class business analyst preparing an investment memo.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      return response.choices[0]?.message?.content?.trim() || 'Analysis unavailable.';
    } catch (error) {
      console.error('Error generating analysis:', error);
      return 'Unable to generate analysis at this time.';
    }
  }
}

// Singleton instance
export const intelligentSearch = new IntelligentSearchEngine();

