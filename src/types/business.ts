// Business Analysis Types
export interface BusinessInfo {
  name: string;
  email: string;
  website?: string;
  linkedinProfiles?: string;
  stage: 'idea' | 'mvp' | 'early-revenue' | 'scaling';
  industry: string;
  targetMarket: string;
  businessModel: string;
  monthlyRevenue: string;
  teamSize: string;
  uploadedFiles?: File[];
  preScrapedText?: string;
  preScrapedSources?: Array<{ url?: string; snippet?: string }>;
  demoKpiCsv?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'analysis' | 'file' | 'summary';
  attachments?: string[];
  evidence?: Array<{
    source: 'website' | 'document' | 'other';
    snippet: string;
    url?: string;
    docId?: string;
  }>;
  metrics?: {
    latencyMs?: number;
    tokensEstimate?: number;
    costUsdEstimate?: number;
  };
  actions?: Array<{
    type: 'link' | 'button';
    label: string;
    url?: string;
    action?: string;
    variant?: 'primary' | 'secondary';
  }>;
}

export interface BusinessAnalysisResult {
  accuracy: number;
  analysisTime: number;
  companyContext: {
    stage: string;
    industry: string;
    targetMarket: string;
    businessModel: string;
    revenue: string;
    team: string;
  };
  investmentThesis: {
    opportunitySize: string;
    marketValidation: string;
    competitiveAdvantage: string;
    scalabilityFactor: number;
  };
  actionableInsights: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    timeline: string;
    expectedImpact: string;
    specificSteps: string[];
  }>;
  riskFactors: Array<{
    risk: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  recommendations: {
    fundingStrategy: string;
    nextMilestones: string[];
    teamGaps: string[];
    marketApproach: string;
  };
  scores: {
    problemSolutionFit: number;
    marketTiming: number;
    competitiveMoat: number;
    businessModel: number;
    teamExecution: number;
    traction: number;
    financialHealth: number;
    overallScore: number;
  };
  followUpQuestions?: string[];
}

export interface AnalysisStep {
  id: string;
  label: string;
  duration: number;
  completed: boolean;
}

export enum AnalysisState {
  START = 'start',
  PERMISSION = 'permission',
  ANALYZING = 'analyzing',
  RESULTS = 'results',
  ERROR = 'error',
}

export interface UserProfile {
  businessInfo: BusinessInfo;
  analysisHistory: BusinessAnalysisResult[];
  preferences: {
    analysisDepth: 'quick' | 'standard' | 'comprehensive';
    focusAreas: string[];
  };
}
