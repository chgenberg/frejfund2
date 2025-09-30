import { getChatModel } from './ai-client';
import { BusinessInfo } from '@/types/business';

interface EmailContext {
  businessInfo: BusinessInfo;
  investor: {
    name: string;
    firmName: string;
    thesis?: string;
    notableInvestments?: string[];
    sweetSpot?: string;
  };
  emailType: 'cold_outreach' | 'warm_intro' | 'follow_up' | 'update';
  mutualConnection?: {
    name: string;
    relationship: string;
  };
  previousInteraction?: string;
}

/**
 * Generate personalized investor email
 */
export async function generateInvestorEmail(context: EmailContext): Promise<{
  subject: string;
  body: string;
  tips: string[];
}> {
  const { businessInfo, investor, emailType, mutualConnection, previousInteraction } = context;
  
  // Build prompt based on email type
  let prompt = '';
  
  if (emailType === 'cold_outreach') {
    prompt = `Write a cold outreach email to ${investor.name} at ${investor.firmName}.

BUSINESS:
- Company: ${businessInfo.name}
- Industry: ${businessInfo.industry}
- Stage: ${businessInfo.stage}
- Model: ${businessInfo.businessModel}
- Market: ${businessInfo.targetMarket}

INVESTOR:
- Thesis: ${investor.thesis || 'N/A'}
- Sweet spot: ${investor.sweetSpot || 'N/A'}
- Notable investments: ${investor.notableInvestments?.join(', ') || 'N/A'}

REQUIREMENTS:
- Subject line: 10-15 words, compelling, no "Quick question" or generic phrases
- Email: 150-200 words max
- Structure: Hook → Traction → Why them → CTA
- Tone: Professional but warm, founder-to-investor
- Include 1-2 specific data points
- Reference their portfolio if relevant
- Clear ask (meeting request)
- NO fluff, NO buzzwords, NO hyperbole

FORMAT:
Subject: [Your subject line]

Body: [Email body]

Return ONLY the email. No explanations.`;
  } else if (emailType === 'warm_intro') {
    prompt = `Write a warm introduction request email.

You want ${mutualConnection?.name || 'a mutual connection'} to introduce you to ${investor.name} at ${investor.firmName}.

BUSINESS:
- Company: ${businessInfo.name}
- Industry: ${businessInfo.industry}
- Stage: ${businessInfo.stage}
- Model: ${businessInfo.businessModel}

INVESTOR:
- Thesis: ${investor.thesis || 'N/A'}
- Notable investments: ${investor.notableInvestments?.join(', ') || 'N/A'}

REQUIREMENTS:
- Subject: "Intro request: [Your company] → ${investor.firmName}"
- Email to connector: 100-150 words
- Make it EASY for them to forward
- Include 2-3 sentence forwardable blurb about your company
- Explain why ${investor.firmName} is a good fit
- Respectful of their time

FORMAT:
Subject: [Subject line]

Body: [Email body]

Forwardable blurb: [2-3 sentence description they can copy-paste]

Return formatted output.`;
  } else if (emailType === 'follow_up') {
    prompt = `Write a follow-up email to ${investor.name} at ${investor.firmName}.

Previous interaction: ${previousInteraction || 'Sent initial pitch 2 weeks ago, no response'}

BUSINESS:
- Company: ${businessInfo.name}
- What's new: [Insert recent traction/milestone]

REQUIREMENTS:
- Subject: Reference previous email
- Body: 80-120 words
- Add value (new traction, insight, or ask)
- Polite, not pushy
- Clear CTA

Return ONLY the email.`;
  }
  
  try {
    const openai = getChatModel('simple');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const emailText = response.choices[0].message.content?.trim() || '';
    
    // Parse subject and body
    const subjectMatch = emailText.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Partnership opportunity: ${businessInfo.name}`;
    
    // Extract body (everything after subject line)
    let body = emailText;
    if (subjectMatch) {
      body = emailText.substring(emailText.indexOf(subjectMatch[0]) + subjectMatch[0].length).trim();
    }
    
    // Remove "Body:" prefix if present
    body = body.replace(/^Body:\s*/i, '').trim();
    
    // Generate tips for improving the email
    const tips = generateEmailTips(emailType, context);
    
    return {
      subject,
      body,
      tips
    };
  } catch (error) {
    console.error('Error generating email:', error);
    
    // Fallback template
    return {
      subject: `${businessInfo.name} - ${businessInfo.industry} opportunity`,
      body: `Hi ${investor.name},\n\nI'm reaching out because ${investor.firmName}'s focus on ${investor.sweetSpot || 'early-stage companies'} aligns perfectly with what we're building at ${businessInfo.name}.\n\nWe're a ${businessInfo.stage} stage ${businessInfo.industry} company targeting ${businessInfo.targetMarket}. Would love to schedule a brief call to share our story.\n\nBest,\n[Your name]`,
      tips: ['Personalize the opening', 'Add specific traction metrics', 'Reference their portfolio']
    };
  }
}

/**
 * Generate tips for improving the email
 */
function generateEmailTips(emailType: string, context: EmailContext): string[] {
  const tips: string[] = [];
  
  if (emailType === 'cold_outreach') {
    tips.push('✓ Send Tuesday-Thursday, 8-10 AM for best open rates');
    tips.push('✓ Follow up after 5-7 days if no response');
    tips.push('✓ Keep it under 150 words');
    
    if (context.investor.notableInvestments && context.investor.notableInvestments.length > 0) {
      tips.push(`✓ Mention their investment in ${context.investor.notableInvestments[0]}`);
    }
  } else if (emailType === 'warm_intro') {
    tips.push('✓ Make it as easy as possible to forward');
    tips.push('✓ Keep the forwardable blurb under 3 sentences');
    tips.push('✓ Thank the connector personally');
  } else if (emailType === 'follow_up') {
    tips.push('✓ Add new information (traction, news, insight)');
    tips.push('✓ Don\'t be pushy - give them an out');
    tips.push('✓ Reference specific point from first email');
  }
  
  return tips;
}

/**
 * Generate subject line variations for A/B testing
 */
export async function generateSubjectVariations(
  businessInfo: BusinessInfo,
  investor: { firmName: string }
): Promise<string[]> {
  const prompt = `Generate 5 email subject line variations for reaching out to ${investor.firmName}.

Company: ${businessInfo.name}
Industry: ${businessInfo.industry}
Stage: ${businessInfo.stage}

Requirements:
- 10-15 words each
- Compelling, not generic
- No "Quick question" or "Touching base"
- Specific and intriguing
- Professional

Return only the 5 subject lines, one per line.`;

  try {
    const openai = getChatModel('simple');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 200
    });
    
    const text = response.choices[0].message.content?.trim() || '';
    return text.split('\n').filter(line => line.trim()).slice(0, 5);
  } catch (error) {
    console.error('Error generating subject variations:', error);
    return [
      `${businessInfo.name} - ${businessInfo.industry} partnership opportunity`,
      `Scaling ${businessInfo.industry} in ${businessInfo.targetMarket}`,
      `${investor.firmName} + ${businessInfo.name}: potential fit?`,
      `${businessInfo.stage} stage ${businessInfo.industry} seeking ${investor.firmName}`,
      `Following your ${investor.firmName} thesis - ${businessInfo.name}`
    ];
  }
}
