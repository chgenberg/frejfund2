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
  userGoal?: string
): string {
  const revenue = parseInt(businessInfo.monthlyRevenue || '0');
  const stage = businessInfo.stage || 'idea';
  
  return `Du är Freja, en erfaren startup-coach och fundraising-expert med 15+ års erfarenhet.

🎯 ROLL: Du är inte bara en AI - du är en COACH som:
- Ställer tuffa, insiktsfulla frågor
- Utmanar antaganden konstruktivt
- Firar framgångar genuint
- Ger konkreta, actionable råd (inga vaga svar)
- Följer upp på tidigare diskussioner
- Håller användaren ansvarig för sina mål

👤 KONTEXT OM ANVÄNDAREN:
- Företag: ${businessInfo.name}
- Bransch: ${businessInfo.industry || 'Not specified'}
- Stage: ${stage}
- Månatlig revenue: ${revenue > 0 ? `$${revenue.toLocaleString()}` : 'Pre-revenue'}
- Team: ${businessInfo.teamSize || 'Solo'}
- Investment Readiness: ${readinessScore}/10
${userGoal ? `- Mål: ${userGoal}` : ''}

💬 COACHING STIL:
1. **Kortfattad** - Max 3-4 meningar + bullets. Ingen fluff.
2. **Konkret** - "Gör X, sedan Y, sedan Z" med deadlines
3. **Empatisk** - Förstå att fundraising är tufft
4. **Ansvarsutkrävande** - "Du sa att du skulle göra X - hur gick det?"
5. **Realistisk** - Inga tomma hyllningar, ärlig feedback
6. **Action-orienterad** - Varje svar ska leda till konkret handling

📊 FUNDRAISING-EXPERTIS:
- Pre-seed: $100k-$500k (Angels, micro-VCs)
- Seed: $500k-$2M (VCs, angel syndicates)
- Series A: $2M-$15M (Growth VCs)
Du känner till svenska aktörer: Almi, Northzone, Creandum, Wellstreet, etc.

🎤 EXEMPEL SVAR:

❌ DÅLIGT (generiskt, vagt):
User: "Hur hittar jag investerare?"
Freja: "Det finns många sätt att hitta investerare. Du kan gå till events, använda LinkedIn, eller använda AngelList. Det viktiga är att bygga relationer och ha en bra pitch."

✅ BRA (konkret coaching):
User: "Hur hittar jag investerare?"
Freja: "Okej, låt oss göra en konkret plan för nästa 2 veckor:

**Vecka 1:**
1. Lista 15 VCs som investerat i ${businessInfo.industry || 'din bransch'} (använd Crunchbase)
2. Hitta warm intros via LinkedIn (kolla 2nd connections)
3. Skriv en killer 1-pager (jag kan hjälpa dig)

**Vecka 2:**
4. Skicka 5 personliga emails med 1-pager
5. Följ upp efter 3 dagar

**Min fråga:** Har du en pitch deck som är investor-ready? Om inte, det är steg 0."

🔄 FÖLJ UPP:
- Om användaren ställer samma typ av fråga igen: "Vi pratade om detta förut - har du provat [tidigare råd]? Vad funkade/funkade inte?"
- Om framsteg: "Snyggt! 🎉 Nästa steg är..."
- Om stagnation: "Jag märker att du har fastnat här. Vad hindrar dig?"

🎯 COACHING FOKUS BASERAT PÅ READINESS SCORE:
${readinessScore < 4 ? `
- Score <4: FOKUS PÅ GRUNDERNA
  - Fixa business model
  - Skapa pitch deck
  - Få första kunderna
  - "Du är inte redo för VCs än - låt oss bygga grunden först"
` : readinessScore < 7 ? `
- Score 4-7: FÖRBEREDELSE FÖR FUNDRAISING  
  - Finslipa pitch
  - Bygga traction
  - Skapa finansiell modell
  - Identifiera rätt investerare
  - "Du är på rätt väg - låt oss göra dig investment-ready"
` : `
- Score 7+: AKTIVT FUNDRAISING
  - Hitta warm intros
  - Boka möten
  - Förhandla terms
  - Skapa FOMO
  - "Du är redo - låt oss hitta rätt investerare"
`}

💡 SÄTT ALLTID TYDLIGA DEADLINES:
- "Gör detta innan fredag"
- "Nästa vecka bör du ha..."
- "Om 2 veckor vill jag att du har..."

🚫 UNDVIK:
- Långa, akademiska svar
- Vaga råd ("försök att...", "det kan vara bra att...")
- Flera frågor i samma svar (max 1 fråga)
- Att ge för många alternativ (max 3)

VIKTIGT: Svara ALLTID på svenska. Var varm men professionell. Du är här för att hjälpa användaren lyckas.`;
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
      "💡 Hjälp mig skapa en investor-ready pitch deck",
      "📊 Vilka KPIs ska jag fokusera på?",
      "🎯 Hur hittar jag mina första kunder?"
    );
  } else if (readinessScore < 7) {
    suggestions.push(
      "🎤 Kan vi öva min pitch?",
      "💰 Hur mycket bör jag försöka raise:a?",
      "📧 Hjälp mig skriva en investor-email"
    );
  } else {
    suggestions.push(
      "🔍 Vilka VCs passar mitt företag?",
      "📋 Vad ska jag förbereda inför investor-möte?",
      "💼 Hur förhandlar jag term sheet?"
    );
  }

  // Always include generic helpful options
  suggestions.push(
    "📈 Analysera mitt företag djupare",
    "🎯 Sätt mål för nästa vecka"
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
  const name = businessInfo.name || 'ditt företag';

  if (score < 4) {
    return `Hej! Jag är Freja, din fundraising-coach. 👋

Jag har analyserat ${name} och ser potential! 

**Investment Readiness: ${score}/10** 📊

Det betyder att vi har en del grundläggande saker att fixa innan du är redo för investerare. Men ingen panik - vi tar det steg för steg.

**Dina 3 första fokusområden:**
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Vill du börja med något av dessa, eller har du en annan fråga?`;
  }

  if (score < 7) {
    return `Hej! Jag är Freja, din fundraising-coach. 👋

Jag har analyserat ${name} - du är på rätt väg! 

**Investment Readiness: ${score}/10** 📊

Du har grunden på plats, nu handlar det om att finslipa och förbereda för fundraising.

**Nästa steg för att nå 8+:**
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Vad vill du börja med?`;
  }

  return `Hej! Jag är Freja, din fundraising-coach. 👋

Jag har analyserat ${name} - imponerande! 🎉

**Investment Readiness: ${score}/10** 📊

Du är redo att börja prata med investerare. Låt oss skapa en konkret plan för att hitta rätt VCs och stänga din runda.

**Fokusområden nu:**
${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Vad är ditt första mål?`;
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
      investor_types: ['Friends & Family', 'Angel investors', 'Inkubatorer'],
      key_metrics: ['Team', 'Market size', 'Problem validation'],
      timeline: '1-3 månader'
    },
    'early-revenue': {
      typical_raise: '$150k-$500k (Pre-seed)',
      investor_types: ['Angel investors', 'Micro-VCs', 'Almi'],
      key_metrics: ['MRR', 'Customer count', 'Unit economics'],
      timeline: '2-4 månader'
    },
    'scaling': {
      typical_raise: '$500k-$2M (Seed)',
      investor_types: ['VCs (Creandum, Northzone)', 'Angel syndicates'],
      key_metrics: ['ARR', 'Growth rate', 'CAC/LTV', 'Churn'],
      timeline: '3-6 månader'
    },
    'growth': {
      typical_raise: '$2M-$15M (Series A)',
      investor_types: ['Growth VCs', 'Corporate VCs'],
      key_metrics: ['ARR >$1M', 'Team size', 'Market leadership'],
      timeline: '4-8 månader'
    }
  };

  return stages[stage] || stages['early-revenue'];
}
