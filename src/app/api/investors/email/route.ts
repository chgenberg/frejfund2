import { NextRequest, NextResponse } from 'next/server';
import { generateInvestorEmail, generateSubjectVariations } from '@/lib/email-generator';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/investors/email - Generate email draft for an investor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      investorId, 
      businessInfo, 
      emailType = 'cold_outreach',
      mutualConnection,
      previousInteraction 
    } = body;

    if (!investorId || !businessInfo) {
      return NextResponse.json({ 
        error: 'Investor ID and business info required' 
      }, { status: 400 });
    }

    // Fetch investor from database
    const investor = await prisma.investor.findUnique({
      where: { id: investorId }
    });

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    // Generate email
    const email = await generateInvestorEmail({
      businessInfo,
      investor: {
        name: investor.name,
        firmName: investor.firmName || investor.name,
        thesis: investor.thesis,
        notableInvestments: investor.notableInvestments,
        sweetSpot: investor.sweetSpot
      },
      emailType,
      mutualConnection,
      previousInteraction
    });

    // Generate subject variations
    const subjectVariations = await generateSubjectVariations(businessInfo, {
      firmName: investor.firmName || investor.name
    });

    return NextResponse.json({ 
      email: {
        subject: email.subject,
        body: email.body,
        tips: email.tips,
        subjectVariations
      },
      investor: {
        name: investor.name,
        firmName: investor.firmName,
        email: investor.email,
        linkedIn: investor.linkedIn
      }
    });
  } catch (error) {
    console.error('Error generating email:', error);
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
  }
}
