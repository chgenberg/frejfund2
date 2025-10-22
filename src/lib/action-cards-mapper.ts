import { ActionCardType } from '@/components/ActionCard';

interface Gap {
  dimensionId: string;
  dimensionName: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  currentScore: number;
  potentialScoreIncrease: number;
  missingInfo: string[];
  recommendations?: string[];
}

interface AnalysisData {
  overallScore: number;
  confidenceWeightedScore: number;
  dataCompleteness: number;
  dimensions: any[];
  insights?: any[];
}

export interface MappedActionCard {
  id: string;
  type: ActionCardType;
  title: string;
  description: string;
  impact?: string;
  progress?: number;
  details?: string[];
  actionLabel?: string;
  uploadEnabled?: boolean;
}

export function mapGapsToActionCards(
  gaps: Gap[] | null,
  analysisData: AnalysisData | null
): MappedActionCard[] {
  const cards: MappedActionCard[] = [];

  // 1. Critical Gaps (Red)
  if (gaps) {
    const criticalGaps = gaps.filter(g => g.priority === 'critical').slice(0, 2);
    criticalGaps.forEach(gap => {
      cards.push({
        id: `critical-${gap.dimensionId}`,
        type: 'critical',
        title: `Fix ${gap.dimensionName}`,
        description: gap.missingInfo[0] || 'Critical data missing for investor evaluation',
        impact: `+${gap.potentialScoreIncrease} pts`,
        details: [
          ...gap.missingInfo.slice(0, 3),
          ...(gap.recommendations?.slice(0, 2) || [])
        ],
        actionLabel: 'Fix Now',
        uploadEnabled: gap.dimensionName.toLowerCase().includes('metric') || 
                       gap.dimensionName.toLowerCase().includes('financial')
      });
    });
  }

  // 2. Quick Wins (Yellow)
  if (analysisData?.dataCompleteness && analysisData.dataCompleteness < 80) {
    cards.push({
      id: 'quickwin-upload-deck',
      type: 'quickwin',
      title: 'Upload Your Pitch Deck',
      description: 'Auto-extract metrics like CAC, LTV, MRR from your existing materials',
      impact: '+8 pts',
      details: [
        'Automatic OCR extraction of key metrics',
        'Fill multiple data gaps at once',
        'Takes less than 2 minutes',
        'Supports PDF, PPTX, and Google Slides'
      ],
      actionLabel: 'Upload Deck',
      uploadEnabled: true
    });
  }

  // 3. Missing Metrics (Blue)
  const metricGaps = gaps?.filter(g => 
    g.dimensionName.toLowerCase().includes('metric') || 
    g.dimensionName.toLowerCase().includes('unit') ||
    g.dimensionName.toLowerCase().includes('retention')
  ).slice(0, 2);

  metricGaps?.forEach(gap => {
    cards.push({
      id: `missing-${gap.dimensionId}`,
      type: 'missing',
      title: gap.dimensionName,
      description: 'Key metrics investors need to see',
      impact: `+${gap.potentialScoreIncrease} pts`,
      details: [
        'How to calculate this metric',
        'Industry benchmarks to target',
        'Tools to track automatically',
        ...gap.missingInfo
      ],
      actionLabel: 'Add Data'
    });
  });

  // 4. Red Flags (Orange)
  const weakDimensions = analysisData?.dimensions
    ?.filter((d: any) => d.score < 40 && d.redFlags?.length > 0)
    .slice(0, 1);

  weakDimensions?.forEach((dim: any) => {
    cards.push({
      id: `redflag-${dim.id}`,
      type: 'redflag',
      title: dim.redFlags[0] || 'Address Critical Concern',
      description: `${dim.name} needs immediate attention`,
      impact: 'High Risk',
      details: [
        ...dim.redFlags.slice(0, 2),
        ...dim.recommendations?.slice(0, 2) || []
      ],
      actionLabel: 'Learn More'
    });
  });

  // 5. Milestones (Green)
  if (analysisData?.overallScore) {
    const currentScore = analysisData.overallScore;
    let milestone = '';
    let target = 0;
    
    if (currentScore < 40) {
      milestone = 'Pre-seed Ready';
      target = 40;
    } else if (currentScore < 60) {
      milestone = 'Seed Ready';
      target = 60;
    } else if (currentScore < 80) {
      milestone = 'Series A Ready';
      target = 80;
    } else {
      milestone = 'Scale Ready';
      target = 95;
    }

    const progress = Math.round((currentScore / target) * 100);

    cards.push({
      id: 'milestone-funding',
      type: 'milestone',
      title: `Reach ${milestone} Status`,
      description: `${target - currentScore} points to unlock next funding stage`,
      progress,
      details: [
        'Complete critical data gaps',
        'Improve retention metrics',
        'Strengthen go-to-market strategy',
        'Build investor-ready financials'
      ],
      actionLabel: 'View Checklist'
    });
  }

  // 6. Learning Cards (Purple)
  const weakestCategory = analysisData?.dimensions
    ?.reduce((acc: any, dim: any) => {
      const cat = dim.category;
      if (!acc[cat]) acc[cat] = { total: 0, count: 0, name: cat };
      acc[cat].total += dim.score || 0;
      acc[cat].count += 1;
      return acc;
    }, {});

  if (weakestCategory) {
    const categories = Object.values(weakestCategory) as any[];
    const weakest = categories
      .map(c => ({ ...c, avg: c.total / c.count }))
      .sort((a, b) => a.avg - b.avg)[0];

    if (weakest && weakest.avg < 60) {
      cards.push({
        id: 'learn-category',
        type: 'learn',
        title: `Master ${weakest.name}`,
        description: 'Deep-dive guide to ace this category',
        details: [
          '15-minute video walkthrough',
          'Templates and examples',
          'Common mistakes to avoid',
          'VC perspective insights'
        ],
        actionLabel: 'Start Learning'
      });
    }
  }

  // Sort cards by impact/priority
  return cards.sort((a, b) => {
    const priority: Record<ActionCardType, number> = {
      critical: 1,
      redflag: 2,
      quickwin: 3,
      missing: 4,
      milestone: 5,
      learn: 6
    };
    return priority[a.type] - priority[b.type];
  });
}
