/**
 * SIMPLIFIED WARM INTRO FINDER
 * 
 * Instead of scraping LinkedIn (which violates ToS), we:
 * 1. Ask user to paste LinkedIn URLs of their key connections
 * 2. Show visual network map
 * 3. Guide them through finding mutual connections manually
 * 4. Generate perfect intro request messages
 */

import { getChatModel } from './ai-client';
import prisma from './prisma';

interface UserConnection {
  id: string;
  userId: string;
  name: string;
  linkedInUrl?: string;
  relationship: string; // 'colleague' | 'friend' | 'investor' | 'advisor' | 'customer'
  strength: number; // 1-5, how well do you know them
  industries?: string[];
  companies?: string[]; // Where they work/worked
  createdAt: Date;
}

/**
 * Save a user's key connections for warm intro purposes
 */
export async function saveConnection(
  userId: string,
  connection: Omit<UserConnection, 'id' | 'userId' | 'createdAt'>
): Promise<UserConnection> {
  // Store in database (we'll add a UserConnection model to Prisma)
  // For now, store in session metadata
  
  return {
    id: `conn_${Date.now()}`,
    userId,
    createdAt: new Date(),
    ...connection
  };
}

/**
 * Find potential warm intro paths based on user's saved connections
 */
export async function findPotentialIntros(
  userConnections: UserConnection[],
  targetInvestor: {
    name: string;
    firmName: string;
    linkedInUrl?: string;
  }
): Promise<{
  possibleConnectors: UserConnection[];
  suggestions: string[];
}> {
  const possibleConnectors: UserConnection[] = [];
  const suggestions: string[] = [];

  // Strategy 1: Check if any connection works at the same firm
  const firmConnections = userConnections.filter(conn => 
    conn.companies?.some(company => 
      company.toLowerCase().includes(targetInvestor.firmName.toLowerCase())
    )
  );

  if (firmConnections.length > 0) {
    possibleConnectors.push(...firmConnections);
    suggestions.push(`💡 ${firmConnections[0].name} works at ${targetInvestor.firmName}! Perfect warm intro.`);
  }

  // Strategy 2: Check industry overlap
  const industryConnections = userConnections.filter(conn => 
    conn.industries?.some(ind => 
      targetInvestor.firmName.toLowerCase().includes(ind.toLowerCase())
    )
  );

  if (industryConnections.length > 0) {
    possibleConnectors.push(...industryConnections);
    suggestions.push(`💡 ${industryConnections[0].name} is in the same industry as ${targetInvestor.firmName}`);
  }

  // Strategy 3: Strong connections (strength >= 4)
  const strongConnections = userConnections.filter(conn => conn.strength >= 4);
  
  if (strongConnections.length > 0) {
    suggestions.push(`💡 Ask your strong connections (${strongConnections.slice(0, 3).map(c => c.name).join(', ')}) if they know anyone at ${targetInvestor.firmName}`);
  }

  // Strategy 4: LinkedIn Sales Navigator suggestion
  suggestions.push(`🔍 Use LinkedIn Sales Navigator to search "${targetInvestor.name}" and filter by 2nd-degree connections`);

  return {
    possibleConnectors: possibleConnectors.slice(0, 5),
    suggestions
  };
}

/**
 * Generate AI-powered warm intro request message
 */
export async function generateWarmIntroRequest(
  connector: {
    name: string;
    relationship: string;
  },
  investor: {
    name: string;
    firmName: string;
    thesis?: string;
  },
  businessInfo: {
    name: string;
    industry: string;
    stage: string;
    traction?: string;
  }
): Promise<{
  message: string;
  forwardableBlurb: string;
  tips: string[];
}> {
  const prompt = `Write a warm introduction request message.

CONTEXT:
You want ${connector.name} (your ${connector.relationship}) to introduce you to ${investor.name} at ${investor.firmName}.

YOUR COMPANY:
- Name: ${businessInfo.name}
- Industry: ${businessInfo.industry}
- Stage: ${businessInfo.stage}
- Traction: ${businessInfo.traction || 'Early stage'}

INVESTOR:
- ${investor.firmName}
- Focus: ${investor.thesis || 'Investment focus'}

REQUIREMENTS:
1. Message to ${connector.name}:
   - Personal and respectful
   - Explain why ${investor.firmName} is a good fit
   - Make it EASY for them to forward
   - 100-150 words

2. Forwardable blurb (that ${connector.name} can copy-paste):
   - 2-3 sentences
   - Professional
   - Clear value proposition
   - Specific ask

FORMAT:
Message:
[Your message to ${connector.name}]

Forwardable blurb:
[Text they can forward to ${investor.name}]

Return formatted output.`;

  try {
    const openai = getChatModel('simple');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400
    });

    const text = response.choices[0].message.content?.trim() || '';

    // Parse message and blurb
    const messageMatch = text.match(/Message:\s*([\s\S]+?)(?=Forwardable blurb:|$)/i);
    const blurbMatch = text.match(/Forwardable blurb:\s*([\s\S]+)/i);

    const message = messageMatch ? messageMatch[1].trim() : text;
    const forwardableBlurb = blurbMatch ? blurbMatch[1].trim() : '';

    const tips = [
      `✓ Send this to ${connector.name} directly (not group message)`,
      `✓ Offer to draft the forwardable blurb for them`,
      `✓ Follow up if no response in 3-4 days`,
      `✓ Thank them regardless of outcome`,
      `✓ Warm intros have 10x higher response rate than cold emails`
    ];

    return {
      message,
      forwardableBlurb,
      tips
    };
  } catch (error) {
    console.error('Error generating warm intro request:', error);
    
    return {
      message: `Hi ${connector.name},\n\nHope you're doing well! I'm reaching out because I saw you're connected to ${investor.name} at ${investor.firmName}.\n\nI'm raising a seed round for ${businessInfo.name}, and ${investor.firmName}'s focus aligns perfectly with what we're building. Would you be comfortable making a warm introduction?\n\nHappy to send you a forwardable blurb!\n\nThanks!`,
      forwardableBlurb: `${investor.name}, wanted to introduce you to [Your name], founder of ${businessInfo.name}. They're building [description] in the ${businessInfo.industry} space. Worth a conversation?`,
      tips: [
        'Make it easy for your connector',
        'Offer to draft the intro for them',
        'Thank them regardless of outcome'
      ]
    };
  }
}

/**
 * CONVERSATIONAL HELPER
 * Guides user through finding warm intros via chat
 */
export async function generateWarmIntroGuidance(
  investorName: string,
  investorFirm: string
): Promise<string> {
  return `**Finding a warm intro to ${investorFirm}** 🔗

Here's how to find the best path:

**1. Check LinkedIn (easiest):**
• Go to ${investorName}'s LinkedIn profile
• Look at "Mutual Connections"
• Pick the strongest connection (colleague, friend, advisor)

**2. Ask your network:**
• Post in founder Slack groups: "Anyone know ${investorName} at ${investorFirm}?"
• Ask your investors/advisors if they have connections
• Check if any customers/partners know them

**3. Common intro paths:**
• Previous investors (if you've raised before)
• Accelerator mentors (YC, Techstars, etc.)
• Industry advisors
• Portfolio company founders (reach out to founders they've backed)

**4. When you find a connector:**
Say: "I found [Name]! Draft warm intro request"
I'll write the perfect message for you.

**No mutual connections?**
• Engage with their content on LinkedIn first (thoughtful comments)
• Reference their blog posts/podcasts in your cold email
• Attend events where they're speaking

Need help with any of these steps?`;
}
