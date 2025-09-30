/**
 * Coaching Prompts for FrejFund
 * 
 * FrejFund = Personal Fundraising & Growth Coach
 * Mission: Help founders go from idea → investment-ready → funded
 */

import { BusinessInfo } from '@/types/business';

/**
 * Calculate Investment Readiness Score (0-10)
 * Based on business stage, revenue, team, and materials
 */
export function calculateReadinessScore(businessInfo: BusinessInfo): {
  score: number;
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];
  nextSteps: string[];
} {
  const breakdown = [];
  let totalScore = 0;

  // 1. Business Model Clarity (0-2 points)
  let businessModelScore = 0;
  if (businessInfo.businessModel && businessInfo.businessModel.length > 10) {
    businessModelScore = 1.5;
  }
  if (businessInfo.industry && businessInfo.targetMarket) {
    businessModelScore += 0.5;
  }
  breakdown.push({
    category: 'Business Model',
    score: businessModelScore,
    maxScore: 2,
    feedback: businessModelScore >= 1.5 
      ? 'Clear business model ✓' 
      : 'Need clearer business model description'
  });
  totalScore += businessModelScore;

  // 2. Traction (0-3 points)
  let tractionScore = 0;
  const revenue = parseInt(businessInfo.monthlyRevenue || '0');
  if (revenue > 0) tractionScore += 1;
  if (revenue > 10000) tractionScore += 1;
  if (revenue > 50000) tractionScore += 1;
  
  breakdown.push({
    category: 'Traction',
    score: tractionScore,
    maxScore: 3,
    feedback: revenue === 0 
      ? 'No revenue yet - focus on first customers'
      : revenue < 10000
      ? 'Early traction - aim for $10k MRR'
      : revenue < 50000
      ? 'Good traction - scale to $50k MRR'
      : 'Strong traction ✓'
  });
  totalScore += tractionScore;

  // 3. Team (0-2 points)
  let teamScore = 0;
  const teamSize = businessInfo.teamSize || '';
  if (teamSize.includes('2-5') || teamSize.includes('6-10')) {
    teamScore = 1.5;
  } else if (teamSize.includes('11+')) {
    teamScore = 2;
  } else if (teamSize === '1') {
    teamScore = 0.5;
  }
  
  breakdown.push({
    category: 'Team',
    score: teamScore,
    maxScore: 2,
    feedback: teamScore < 1 
      ? 'Solo founder - consider finding co-founder'
      : teamScore < 1.5
      ? 'Small team - plan key hires'
      : 'Team in place ✓'
  });
  totalScore += teamScore;

  // 4. Materials (0-2 points)
  let materialsScore = 0;
  if (businessInfo.uploadedFiles && businessInfo.uploadedFiles.length > 0) {
    materialsScore = 1;
  }
  if (businessInfo.preScrapedText && businessInfo.preScrapedText.length > 200) {
    materialsScore += 1;
  }
  
  breakdown.push({
    category: 'Pitch Materials',
    score: materialsScore,
    maxScore: 2,
    feedback: materialsScore === 0 
      ? 'No pitch deck yet - create one ASAP'
      : materialsScore === 1
      ? 'Basic materials - refine your pitch deck'
      : 'Materials ready ✓'
  });
  totalScore += materialsScore;

  // 5. Market Understanding (0-1 point)
  let marketScore = 0;
  if (businessInfo.targetMarket && businessInfo.targetMarket.length > 5) {
    marketScore = 1;
  }
  
  breakdown.push({
    category: 'Market Understanding',
    score: marketScore,
    maxScore: 1,
    feedback: marketScore === 0 
      ? 'Define your target market clearly'
      : 'Market defined ✓'
  });
  totalScore += marketScore;

  // Generate next steps based on weakest areas
  const nextSteps: string[] = [];
  const sortedByWeakest = [...breakdown].sort((a, b) => 
    (a.score / a.maxScore) - (b.score / b.maxScore)
  );

  for (const item of sortedByWeakest.slice(0, 3)) {
    if (item.score < item.maxScore * 0.7) {
      nextSteps.push(item.feedback);
    }
  }

  return {
    score: Math.round(totalScore * 10) / 10,
    breakdown,
    nextSteps: nextSteps.length > 0 ? nextSteps : [
      'You\'re on track! Focus on growing revenue',
      'Practice your pitch',
      'Build your investor list'
    ]
  };
}

/**
 * Get coaching system prompt based on user context
 */
export function getCoachingSystemPrompt(
  businessInfo: BusinessInfo,
  readinessScore: number,
  userGoal?: string,
  currentMilestone?: string
): string {
  const revenue = parseInt(businessInfo.monthlyRevenue || '0');
  const stage = businessInfo.stage || 'idea';
  
  return `You are Freja, an experienced startup coach and fundraising expert with 15+ years of experience.

🎯 YOUR ROLE: You are not just an AI - you are a COACH who:
- Asks tough, insightful questions
- Challenges assumptions constructively
- Celebrates wins genuinely
- Gives concrete, actionable advice (no vague answers)
- Follows up on previous discussions
- Holds the user accountable for their goals
- Keeps them focused on their current milestone

👤 USER CONTEXT:
- Company: ${businessInfo.name}
- Industry: ${businessInfo.industry || 'Not specified'}
- Stage: ${stage}
- Monthly Revenue: ${revenue > 0 ? `$${revenue.toLocaleString()}` : 'Pre-revenue'}
- Team: ${businessInfo.teamSize || 'Solo'}
- Investment Readiness: ${readinessScore}/10
${userGoal ? `- **Primary Goal:** ${userGoal}` : ''}
${currentMilestone ? `- **Current Milestone:** ${currentMilestone}` : ''}

💬 COACHING STYLE:
1. **Brief** - Max 3-4 sentences + bullets. No fluff.
2. **Concrete** - "Do X, then Y, then Z" with deadlines
3. **Empathetic** - Understand that fundraising is tough
4. **Accountable** - "You said you'd do X - how did it go?"
5. **Realistic** - No empty praise, honest feedback
6. **Action-oriented** - Every answer should lead to concrete action
7. **Compact formatting** - Use single line breaks between bullets, double line breaks only between major sections

📊 FUNDRAISING EXPERTISE:
- Pre-seed: $100k-$500k (Angels, micro-VCs)
- Seed: $500k-$2M (VCs, angel syndicates)
- Series A: $2M-$15M (Growth VCs)
You know key players: Y Combinator, a16z, Sequoia, local angels, etc.

🎤 EXAMPLE RESPONSES:

❌ BAD (generic, vague):
User: "How do I find investors?"
Freja: "There are many ways to find investors. You can go to events, use LinkedIn, or use AngelList. The important thing is to build relationships and have a good pitch."

✅ GOOD (concrete coaching):
User: "How do I find investors?"
Freja: "Okay, let's make a concrete plan for the next 2 weeks:

**Week 1:**
- List 15 VCs who invested in ${businessInfo.industry || 'your industry'} (use Crunchbase)
- Find warm intros via LinkedIn (check 2nd connections)
- Write a killer 1-pager (I can help you)

**Week 2:**
- Send 5 personalized emails with 1-pager
- Follow up after 3 days

**My question:** Do you have an investor-ready pitch deck? If not, that's step 0."

🔄 FOLLOW UP:
- If user asks the same type of question again: "We talked about this before - have you tried [previous advice]? What worked/didn't work?"
- If progress: "Nice! 🎉 Next step is..."
- If stagnation: "I notice you're stuck here. What's holding you back?"

🎯 COACHING FOCUS:
${userGoal && currentMilestone ? `
**Keep user focused on their goal and current milestone!**
- Goal: ${userGoal}
- Current milestone: ${currentMilestone}
- ALWAYS relate advice back to their roadmap
- Ask: "Have you completed [task] from your milestone yet?"
- Push them to stay on track with deadlines
` : readinessScore < 4 ? `
- Score <4: FOCUS ON FUNDAMENTALS
  - Fix business model
  - Create pitch deck
  - Get first customers
  - "You're not ready for VCs yet - let's build the foundation first"
` : readinessScore < 7 ? `
- Score 4-7: PREPARING FOR FUNDRAISING  
  - Polish pitch
  - Build traction
  - Create financial model
  - Identify right investors
  - "You're on the right track - let's make you investment-ready"
` : `
- Score 7+: ACTIVE FUNDRAISING
  - Find warm intros
  - Book meetings
  - Negotiate terms
  - Create FOMO
  - "You're ready - let's find the right investors"
`}

💡 ALWAYS SET CLEAR DEADLINES:
- "Do this before Friday"
- "Next week you should have..."
- "In 2 weeks I want you to have..."

🚫 AVOID:
- Long, academic answers
- Vague advice ("try to...", "it might be good to...")
- Multiple questions in same response (max 1 question)
- Giving too many options (max 3)

IMPORTANT: ALWAYS respond in ENGLISH. Be warm but professional. You're here to help the user succeed.`;
}

/**
 * Generate suggested next steps/questions after an AI response
 */
export function generateNextStepSuggestions(
  businessInfo: BusinessInfo,
  readinessScore: number,
  conversationContext?: string
): string[] {
  const suggestions: string[] = [];

  // Based on readiness score
  if (readinessScore < 4) {
    suggestions.push(
      "💡 Help me create an investor-ready pitch deck",
      "📊 Which KPIs should I focus on?",
      "🎯 How do I find my first customers?"
    );
  } else if (readinessScore < 7) {
    suggestions.push(
      "🎤 Can we practice my pitch?",
      "💰 How much should I try to raise?",
      "📧 Help me write an investor email"
    );
  } else {
    suggestions.push(
      "🔍 Which VCs fit my company?",
      "📋 What should I prepare for investor meetings?",
      "💼 How do I negotiate a term sheet?"
    );
  }

  // Always include generic helpful options
  suggestions.push(
    "📈 Analyze my business deeper",
    "🎯 Set goals for next week"
  );

  return suggestions.slice(0, 5); // Max 5 suggestions
}

/**
 * Get welcome message based on readiness score
 */
export function getWelcomeMessage(
  businessInfo: BusinessInfo,
  readiness: ReturnType<typeof calculateReadinessScore>
): string {
  const { score, nextSteps } = readiness;
  const name = businessInfo.name || 'your company';

  if (score < 4) {
    return `Hey! I'm Freja, your fundraising coach. 👋

I've analyzed ${name} and I see potential! 

**Investment Readiness: ${score}/10** 📊

This means we have some fundamental things to fix before you're ready for investors. But don't panic - we'll take it step by step.

**Your top 3 focus areas:**
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}

Want to start with one of these, or do you have another question?`;
  }

  if (score < 7) {
    return `Hey! I'm Freja, your fundraising coach. 👋

I've analyzed ${name} - you're on the right track! 

**Investment Readiness: ${score}/10** 📊

You have the foundation in place, now it's about polishing and preparing for fundraising.

**Next steps to reach 8+:**
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}

What do you want to start with?`;
  }

  return `Hey! I'm Freja, your fundraising coach. 👋

I've analyzed ${name} - impressive! 🎉

**Investment Readiness: ${score}/10** 📊

You're ready to start talking to investors. Let's create a concrete plan to find the right VCs and close your round.

**Focus areas now:**
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}

What's your first goal?`;
}

/**
 * Get stage-specific fundraising advice
 */
export function getStageAdvice(stage: string): {
  typical_raise: string;
  investor_types: string[];
  key_metrics: string[];
  timeline: string;
} {
  const stages: Record<string, any> = {
    'idea': {
      typical_raise: '$50k-$150k',
      investor_types: ['Friends & Family', 'Angel investors', 'Incubators'],
      key_metrics: ['Team', 'Market size', 'Problem validation'],
      timeline: '1-3 months'
    },
    'early-revenue': {
      typical_raise: '$150k-$500k (Pre-seed)',
      investor_types: ['Angel investors', 'Micro-VCs', 'Accelerators'],
      key_metrics: ['MRR', 'Customer count', 'Unit economics'],
      timeline: '2-4 months'
    },
    'scaling': {
      typical_raise: '$500k-$2M (Seed)',
      investor_types: ['VCs (a16z, Sequoia)', 'Angel syndicates'],
      key_metrics: ['ARR', 'Growth rate', 'CAC/LTV', 'Churn'],
      timeline: '3-6 months'
    },
    'growth': {
      typical_raise: '$2M-$15M (Series A)',
      investor_types: ['Growth VCs', 'Corporate VCs'],
      key_metrics: ['ARR >$1M', 'Team size', 'Market leadership'],
      timeline: '4-8 months'
    }
  };

  return stages[stage] || stages['early-revenue'];
}
