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
  foundingYear?: string;
  capitalSeeking?: string;
  previousRounds?: string;
  shareholderStructure?: string;
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
  status: 'pending' | 'running' | 'completed';
  data?: any;
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

// ========== INVESTOR READINESS TREE TYPES ==========

export interface ReadinessItemData {
  id: string;
  itemType: string; // 'pitch_deck', 'financial_model', 'revenue', etc.
  displayName: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  status: 'missing' | 'partial' | 'complete';
  completionPercent: number; // 0-100
  score?: number; // 0-100 quality score
  feedback?: string;
  guidancePrompt?: string;
  exampleAnswer?: string;
}

export interface ReadinessBranchData {
  id: string;
  branchType: string; // 'documents', 'traction', 'team', 'market', 'execution'
  displayName: string;
  description?: string;
  sequence: number;
  isRequired: boolean;
  score?: number; // 0-100
  completionPercent: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  items: ReadinessItemData[];
  summary?: string; // What's good
  gaps?: string; // What's missing
  nextSteps?: string; // What to do
  recommendations: string[]; // Concrete actions
}

export interface ReadinessTreeData {
  id: string;
  sessionId: string;
  branches: ReadinessBranchData[];
  totalScore?: number; // 0-100 aggregate
  completionScore: number; // 0-100
  overallReadiness: 'investor_ready' | 'needs_work' | 'early_stage' | 'incomplete';
  lastEvaluatedAt?: Date;
}

export interface ReadinessGuidance {
  branch: ReadinessBranchData;
  topPriorities: string[]; // What should founder focus on first
  quickWins: string[]; // What can be done quickly
  timeline: string; // Estimated timeline to "investor ready"
  resources?: string[]; // Helpful links/templates
}
