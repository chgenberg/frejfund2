import { BusinessInfo, BusinessAnalysisResult, AnalysisStep } from '@/types/business';

export class BusinessAnalyzer {
  private analysisSteps: AnalysisStep[] = [
    { id: 'context', label: 'Analyzing business context', duration: 3000, completed: false },
    { id: 'market', label: 'Evaluating market opportunity', duration: 4000, completed: false },
    {
      id: 'competition',
      label: 'Assessing competitive landscape',
      duration: 3000,
      completed: false,
    },
    { id: 'team', label: 'Analyzing team capabilities', duration: 2000, completed: false },
    { id: 'financials', label: 'Reviewing financial metrics', duration: 3000, completed: false },
    { id: 'insights', label: 'Generating actionable insights', duration: 2000, completed: false },
  ];

  async analyzeBusinessComprehensively(
    businessInfo: BusinessInfo,
    websiteContent?: string,
    uploadedDocs?: string[],
    onProgress?: (step: string, progress: number) => void,
  ): Promise<BusinessAnalysisResult> {
    const startTime = Date.now();
    let currentProgress = 0;

    // Show progress updates while calling real AI API
    const progressInterval = setInterval(() => {
      if (currentProgress < 90) {
        const step =
          this.analysisSteps[Math.floor(currentProgress / (100 / this.analysisSteps.length))];
        onProgress?.(step?.label || 'Processing...', currentProgress);
        currentProgress += 2;
      }
    }, 200);

    try {
      // Call the real AI API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessInfo,
          websiteContent,
          uploadedDocs,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis API failed');
      }

      const result = await response.json();

      clearInterval(progressInterval);
      onProgress?.('Analysis complete', 100);

      return result as BusinessAnalysisResult;
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Analysis failed, using fallback:', error);

      // Fallback to local analysis if API fails
      const analysisTime = (Date.now() - startTime) / 1000;
      return this.generateAnalysisResult(businessInfo, websiteContent, uploadedDocs, analysisTime);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateAnalysisResult(
    businessInfo: BusinessInfo,
    websiteContent?: string,
    uploadedDocs?: string[],
    analysisTime: number,
  ): BusinessAnalysisResult {
    // Calculate accuracy based on available data
    const accuracy = this.calculateAccuracy(businessInfo, websiteContent, uploadedDocs);

    // Generate stage and industry-specific insights
    const insights = this.generateActionableInsights(businessInfo);
    const risks = this.generateRiskFactors(businessInfo);
    const scores = this.calculateBusinessScores(businessInfo);

    return {
      accuracy,
      analysisTime,
      companyContext: {
        stage: businessInfo.stage,
        industry: businessInfo.industry,
        targetMarket: businessInfo.targetMarket,
        businessModel: businessInfo.businessModel,
        revenue: businessInfo.monthlyRevenue,
        team: businessInfo.teamSize,
      },
      investmentThesis: {
        opportunitySize: this.getOpportunitySize(businessInfo),
        marketValidation: this.getMarketValidation(businessInfo),
        competitiveAdvantage: this.getCompetitiveAdvantage(businessInfo),
        scalabilityFactor: this.getScalabilityFactor(businessInfo),
      },
      actionableInsights: insights,
      riskFactors: risks,
      recommendations: this.generateRecommendations(businessInfo),
      scores,
      followUpQuestions: this.generateFollowUpQuestions(businessInfo, accuracy),
    };
  }

  private calculateAccuracy(
    businessInfo: BusinessInfo,
    websiteContent?: string,
    uploadedDocs?: string[],
  ): number {
    let accuracy = 60; // Base accuracy

    // More data = higher accuracy
    if (businessInfo.website && websiteContent) accuracy += 15;
    if (uploadedDocs && uploadedDocs.length > 0) accuracy += 15;
    if (businessInfo.linkedinProfiles) accuracy += 10;

    // Business stage affects accuracy
    if (businessInfo.stage === 'scaling') accuracy += 5;
    if (businessInfo.monthlyRevenue !== '0') accuracy += 5;

    return Math.min(95, accuracy);
  }

  private generateActionableInsights(businessInfo: BusinessInfo) {
    const insights = [];

    // Stage-specific insights
    if (businessInfo.stage === 'idea') {
      insights.push({
        title: 'Validate Your Problem-Solution Fit',
        description: `As an idea-stage ${businessInfo.industry} startup, conduct 15-20 customer problem interviews within the next 30 days to validate market demand.`,
        priority: 'high' as const,
        timeline: '30 days',
        expectedImpact: 'Reduce market risk by 60% and increase investor confidence',
        specificSteps: [
          'Identify 20 potential customers in your target segment',
          'Create interview script focusing on pain points',
          'Schedule and conduct interviews',
          'Document patterns and validate assumptions',
        ],
      });
    }

    // Industry-specific insights
    if (businessInfo.industry.toLowerCase().includes('saas')) {
      insights.push({
        title: 'Implement SaaS Metrics Tracking',
        description: `For your ${businessInfo.businessModel} SaaS business, implement comprehensive metrics tracking including CAC, LTV, and churn rate.`,
        priority: 'high' as const,
        timeline: '2 weeks',
        expectedImpact: 'Enable data-driven growth decisions and investor readiness',
        specificSteps: [
          'Set up analytics tracking (Mixpanel, Amplitude)',
          'Define and track key SaaS metrics',
          'Create monthly metrics dashboard',
          'Establish cohort analysis reporting',
        ],
      });
    }

    // Revenue stage insights
    if (businessInfo.monthlyRevenue !== '0') {
      insights.push({
        title: 'Optimize Unit Economics',
        description: `With ${businessInfo.monthlyRevenue} monthly revenue, focus on improving your customer acquisition cost and lifetime value ratio.`,
        priority: 'medium' as const,
        timeline: '60 days',
        expectedImpact: 'Improve profitability by 25% and funding attractiveness',
        specificSteps: [
          'Calculate current CAC by channel',
          'Measure customer lifetime value',
          'Identify highest ROI acquisition channels',
          'Implement retention improvement program',
        ],
      });
    }

    return insights;
  }

  private generateRiskFactors(businessInfo: BusinessInfo) {
    const risks = [];

    // Stage-specific risks
    if (businessInfo.stage === 'idea') {
      risks.push({
        risk: 'Market Validation Risk',
        severity: 'high' as const,
        mitigation: 'Conduct systematic customer discovery and build MVP to validate assumptions',
      });
    }

    // Team size risks
    if (businessInfo.teamSize === '1') {
      risks.push({
        risk: 'Single Founder Risk',
        severity: 'medium' as const,
        mitigation:
          'Consider bringing on co-founder or building advisory board for complementary skills',
      });
    }

    // Revenue risks
    if (businessInfo.monthlyRevenue === '0' && businessInfo.stage !== 'idea') {
      risks.push({
        risk: 'Revenue Generation Risk',
        severity: 'high' as const,
        mitigation: 'Focus on customer acquisition and monetization strategy validation',
      });
    }

    return risks;
  }

  private calculateBusinessScores(businessInfo: BusinessInfo) {
    // Scoring based on stage and provided information
    const baseScores = {
      problemSolutionFit: 60,
      marketTiming: 65,
      competitiveMoat: 55,
      businessModel: 60,
      teamExecution: 65,
      traction: 50,
      financialHealth: 55,
    };

    // Adjust scores based on stage
    if (businessInfo.stage === 'scaling') {
      baseScores.traction += 20;
      baseScores.financialHealth += 15;
    }

    // Adjust based on revenue
    if (businessInfo.monthlyRevenue !== '0') {
      baseScores.businessModel += 15;
      baseScores.traction += 10;
    }

    const overallScore = Math.round(
      Object.values(baseScores).reduce((sum, score) => sum + score, 0) / 7,
    );

    return { ...baseScores, overallScore };
  }

  private getOpportunitySize(businessInfo: BusinessInfo): string {
    const industryMultipliers: { [key: string]: string } = {
      saas: 'Large - SaaS market growing at 25% annually',
      fintech: 'Very Large - Fintech market expected to reach $400B by 2030',
      healthtech: 'Large - Digital health market growing at 15% CAGR',
      ecommerce: 'Large - E-commerce continues double-digit growth',
    };

    return (
      industryMultipliers[businessInfo.industry.toLowerCase()] ||
      'Medium - Market size depends on specific niche and execution'
    );
  }

  private getMarketValidation(businessInfo: BusinessInfo): string {
    if (businessInfo.monthlyRevenue !== '0') {
      return 'Strong - Revenue indicates market demand validation';
    }
    if (businessInfo.stage === 'mvp') {
      return 'Partial - MVP stage suggests some validation completed';
    }
    return 'Limited - Requires systematic customer discovery and validation';
  }

  private getCompetitiveAdvantage(businessInfo: BusinessInfo): string {
    if (businessInfo.industry.toLowerCase().includes('ai')) {
      return 'Technology-driven - AI capabilities can create strong moats';
    }
    if (businessInfo.targetMarket === 'Enterprises') {
      return 'Sales-driven - Enterprise relationships create switching costs';
    }
    return 'Execution-dependent - Success relies on superior execution and customer focus';
  }

  private getScalabilityFactor(businessInfo: BusinessInfo): number {
    let factor = 5; // Base scalability

    if (businessInfo.businessModel.toLowerCase().includes('subscription')) factor += 2;
    if (businessInfo.businessModel.toLowerCase().includes('marketplace')) factor += 1;
    if (businessInfo.industry.toLowerCase().includes('software')) factor += 2;
    if (businessInfo.targetMarket === 'Enterprises') factor -= 1; // Slower but higher value

    return Math.min(10, factor);
  }

  private generateRecommendations(businessInfo: BusinessInfo) {
    return {
      fundingStrategy: this.getFundingStrategy(businessInfo),
      nextMilestones: this.getNextMilestones(businessInfo),
      teamGaps: this.getTeamGaps(businessInfo),
      marketApproach: this.getMarketApproach(businessInfo),
    };
  }

  private getFundingStrategy(businessInfo: BusinessInfo): string {
    if (businessInfo.stage === 'idea') {
      return 'Focus on pre-seed funding from angels and early-stage VCs. Target €100K-500K to validate and build MVP.';
    }
    if (businessInfo.stage === 'mvp') {
      return 'Seed funding round of €500K-2M to prove product-market fit and initial traction.';
    }
    if (businessInfo.stage === 'early-revenue') {
      return 'Series A funding of €2M-10M to scale go-to-market and expand team.';
    }
    return 'Series B+ funding to accelerate growth and market expansion.';
  }

  private getNextMilestones(businessInfo: BusinessInfo): string[] {
    const milestones = [];

    if (businessInfo.stage === 'idea') {
      milestones.push('Complete customer discovery interviews');
      milestones.push('Build and launch MVP');
      milestones.push('Acquire first 10 paying customers');
    } else if (businessInfo.monthlyRevenue === '0') {
      milestones.push('Achieve first revenue');
      milestones.push('Validate pricing model');
      milestones.push('Build repeatable sales process');
    } else {
      milestones.push('Scale to next revenue milestone');
      milestones.push('Improve unit economics');
      milestones.push('Expand to new market segment');
    }

    return milestones;
  }

  private getTeamGaps(businessInfo: BusinessInfo): string[] {
    const gaps = [];

    if (businessInfo.teamSize === '1') {
      gaps.push('Co-founder with complementary skills');
    }

    if (businessInfo.stage !== 'idea' && businessInfo.monthlyRevenue === '0') {
      gaps.push('Sales/Business Development expertise');
    }

    if (businessInfo.industry.toLowerCase().includes('tech')) {
      gaps.push('Technical leadership if not founder-led');
    }

    return gaps.length > 0 ? gaps : ['Team appears well-structured for current stage'];
  }

  private getMarketApproach(businessInfo: BusinessInfo): string {
    if (businessInfo.targetMarket === 'SMBs') {
      return 'Focus on product-led growth with self-service onboarding and digital marketing channels.';
    }
    if (businessInfo.targetMarket === 'Enterprises') {
      return 'Build consultative sales process with long-term relationship focus and account-based marketing.';
    }
    return 'Develop multi-channel approach with both digital and direct sales strategies.';
  }

  private generateFollowUpQuestions(businessInfo: BusinessInfo, accuracy: number): string[] {
    if (accuracy > 85) return []; // High accuracy, no follow-up needed

    const questions = [];

    if (!businessInfo.website) {
      questions.push('What is your current customer acquisition strategy?');
    }

    if (businessInfo.monthlyRevenue === '0' && businessInfo.stage !== 'idea') {
      questions.push('What is preventing you from generating revenue currently?');
    }

    if (businessInfo.teamSize === '1') {
      questions.push('What are your plans for team expansion in the next 6 months?');
    }

    questions.push('What is your biggest challenge right now?');
    questions.push('Who are your main competitors and how do you differentiate?');

    return questions.slice(0, 3); // Limit to 3 questions
  }
}
