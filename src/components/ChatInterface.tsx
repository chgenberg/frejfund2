'use client';

import { useState, useRef, useEffect } from 'react';
import { ANALYSIS_DIMENSIONS } from '@/lib/deep-analysis-framework';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, TrendingUp, FileText, Brain, BarChart3, ThumbsUp, ThumbsDown, BookOpen, MoreVertical, Info, Lightbulb, X, HelpCircle, Bell, Circle, Paperclip, Upload } from 'lucide-react';
import { BusinessInfo, Message, BusinessAnalysisResult } from '@/types/business';
import { getChatModel, TaskComplexity } from '@/lib/ai-client';
import BusinessAnalysisModal from './BusinessAnalysisModal';
import ResultsModal from './ResultsModal';
import EmailIngestModal from './EmailIngestModal';
import KpiUploadModal from './KpiUploadModal';
import DeckSummaryModal from './DeckSummaryModal';
import HelpModal from './HelpModal';
import MatchChat from './MatchChat';
import IntelligentSearchModal from './IntelligentSearchModal';
import GapFillingModal from './GapFillingModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  analyzeDataGaps, 
  generateSmartQuestions, 
  generateProactiveInsights,
  getNextBestAction 
} from '@/lib/freja-intelligence';

interface ChatInterfaceProps {
  businessInfo: BusinessInfo;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatInterface({ businessInfo, messages, setMessages }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastGap, setLastGap] = useState<{ messageId: string; dimensionName: string; question: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BusinessAnalysisResult | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [insightCard, setInsightCard] = useState<{text: string; type: 'success' | 'warning' | 'info'} | null>(null);
  const [showEvidence, setShowEvidence] = useState<Record<string, boolean>>({});
  const [pendingFeedback, setPendingFeedback] = useState<{ messageId: string; rating: 'up' | 'down' | null } | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackMissing, setFeedbackMissing] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionId] = useState<string>(() => {
    // Try to restore session from localStorage
    const savedSession = typeof window !== 'undefined' ? localStorage.getItem('frejfund-session-id') : null;
    const savedTimestamp = typeof window !== 'undefined' ? localStorage.getItem('frejfund-session-timestamp') : null;
    const now = Date.now();
    
    // Use existing session if less than 24 hours old
    if (savedSession && savedTimestamp && (now - parseInt(savedTimestamp)) < 24 * 60 * 60 * 1000) {
      return savedSession;
    }
    
    // Create new session
    const newSession = `sess-${Math.random().toString(36).slice(2)}-${now}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('frejfund-session-id', newSession);
      localStorage.setItem('frejfund-session-timestamp', now.toString());
    }
    return newSession;
  });
  const abortRef = useRef<AbortController | null>(null);
  const [tips, setTips] = useState<Array<{ title: string; why?: string; action?: string; priority?: string }>>([]);
  const [showTips, setShowTips] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMatchChat, setShowMatchChat] = useState(false);
  const [activeMatchChat, setActiveMatchChat] = useState<any>(null);
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);
  const [showIntelligentSearch, setShowIntelligentSearch] = useState(false);
  const [showGapFilling, setShowGapFilling] = useState(false);
  const [gapFillingData, setGapFillingData] = useState<any>(null);
  const [prefetchedContext, setPrefetchedContext] = useState<string | null>(null);
  const [dailyCompass, setDailyCompass] = useState<{ insights: string[]; risks: string[]; actions: string[]; citations?: Array<{label:string; snippet:string}> } | null>(null);
  const [showCompass, setShowCompass] = useState(false);
  const [loadingCompass, setLoadingCompass] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);
  // Thin top progress bar while "thinking"
  const [thinkingProgress, setThinkingProgress] = useState(0);
  
  // Deep analysis progress tracking
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number;
    total: number;
    status: 'idle' | 'running' | 'completed';
    completedCategories: string[];
  }>({
    current: 0,
    total: 95,
    status: 'idle',
    completedCategories: []
  });
  const [dataGaps, setDataGaps] = useState<any>(null);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const transformGapsForModal = (gapData: any) => {
    if (!gapData || !gapData.gaps) return [];
    
    return gapData.gaps.slice(0, 9).map((gap: any) => ({
      id: gap.dimensionId,
      dimensionId: gap.dimensionId,
      title: gap.dimensionName,
      description: gap.suggestedQuestions?.[0] || 'Please provide more information about this aspect',
      currentScore: gap.currentScore || 0,
      potentialScore: gap.potentialScore || gap.currentScore + 20,
      inputType: gap.requiresDocument ? 'file' : 'text' as const,
      placeholder: gap.placeholder || 'Enter details here...',
      helpText: gap.explanation || undefined,
      category: gap.category
    }));
  };

  const handleGapSubmit = async (responses: Record<string, any>) => {
    const sessionId = localStorage.getItem('frejfund-session-id');
    if (!sessionId) return;

    try {
      // Submit the gap responses
      const response = await fetch('/api/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers: responses })
      });

      if (response.ok) {
        // Success message
        addMessage(
          "Fantastic! I've updated your analysis with the new information. Your investment readiness score is being recalculated now.",
          'agent',
          'success'
        );

        // Trigger a partial re-analysis for the affected dimensions
        const dimensionIds = Object.keys(responses);
        await fetch('/api/deep-analysis/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionId, 
            dimensionIds,
            newData: responses 
          })
        });

        // Reload the analysis data
        setTimeout(() => {
          window.location.href = '/analysis';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit gap data:', error);
      addMessage(
        "I couldn't save your information right now. Please try again.",
        'agent',
        'error'
      );
    }
  };

  const loadDataGaps = async () => {
    const sessionId = localStorage.getItem('frejfund-session-id') || localStorage.getItem('sessionId');
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/gaps?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setDataGaps(data);
        
        // If there are gaps, Freja proactively asks for them
        if (data.totalGaps > 0 && data.nextBestAction) {
          setGapFillingData(data);
          setTimeout(() => {
            const gapMessage: Message = {
              id: Date.now().toString(),
              content: data.criticalGaps > 0
                ? `Amazing! Thank you for all the information. 

I've identified **${data.totalGaps} key areas** where additional information would significantly strengthen your investment case and boost your readiness score.

These are the missing pieces that investors typically look for - filling them in could increase your score by up to **+${data.potentialScoreIncrease} points**!`,
                : `Great work! Your analysis is looking solid. 

I found ${data.totalGaps} areas where we could gather additional data to fine-tune your investment case even further.`,
              sender: 'agent',
              timestamp: new Date(),
              type: 'analysis',
              actions: [
                { 
                  type: 'button', 
                  label: 'Fill in Missing Information', 
                  action: 'openGapFilling',
                  variant: 'primary'
                }
              ]
            };
            setMessages(prev => [...prev, gapMessage]);
          }, 2000); // Small delay after completion celebration
        }
      }
    } catch (error) {
      console.error('Failed to load data gaps:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Animate a subtle loading bar during AI thinking
  useEffect(() => {
    let interval: any;
    let timeoutDone: any;
    if (isTyping) {
      setThinkingProgress(0);
      interval = setInterval(() => {
        setThinkingProgress((p) => {
          if (p >= 90) return 90; // cap until completion
          const delta = p < 50 ? 5 : p < 75 ? 3 : 1;
          return Math.min(p + delta, 90);
        });
      }, 120);
    } else {
      // Finish and reset
      setThinkingProgress((p) => (p > 0 ? 100 : 0));
      timeoutDone = setTimeout(() => setThinkingProgress(0), 400);
    }
    return () => { if (interval) clearInterval(interval); if (timeoutDone) clearTimeout(timeoutDone); };
  }, [isTyping]);

  // Save message to database
  const saveMessageToDb = async (message: Message) => {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role: message.sender,
          content: message.content,
          tokens: message.metrics?.tokensEstimate,
          latencyMs: message.metrics?.latencyMs,
          cost: message.metrics?.costUsdEstimate,
          model: getChatModel('simple')
        })
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // Update message in state and save to database
  const updateMessageWithMetrics = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => {
      const updated = prev.map(m => m.id === messageId ? { ...m, ...updates } : m);
      // Find and save the updated message
      const updatedMessage = updated.find(m => m.id === messageId);
      if (updatedMessage) {
        saveMessageToDb(updatedMessage);
      }
      return updated;
    });
  };

  // Fetch proactive tips on chat start
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Load messages from database first
    (async () => {
      try {
        const res = await fetch(`/api/messages?sessionId=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((m: any) => ({
              id: m.id,
              content: m.content,
              sender: m.role === 'user' ? 'user' : 'agent',
              timestamp: new Date(m.timestamp),
              type: 'text',
              metrics: m.metrics
            })));
            return; // Don't show welcome message if we have history
          }
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
      
      // If no history, show welcome message
      showWelcomeMessage();
    })();
    
    setIsLoadingHistory(false);
    
    // Load notifications
    loadNotifications();
  }, [sessionId, setMessages]);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'x-session-id': sessionId
        }
      });

      if (response.ok) {
        const data = await response.json();
        const apiNotifs = data.notifications || [];
        if (apiNotifs.length > 0) {
          setNotifications(apiNotifs);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }

    // Demo fallback notifications (no login required)
    try {
      const isDemo = Boolean((businessInfo as any).demoKpiCsv);
      if (isDemo) {
        setNotifications([
          {
            id: `demo-intro-${Date.now()}`,
            type: 'intro_request',
            vcName: 'Alex',
            vcFirm: 'Demo Capital',
            vcEmail: 'demo@vc.com',
            matchScore: 92,
            requestedAt: new Date().toISOString(),
            message: 'Demo Capital is interested in meeting you!'
          }
        ]);
      }
    } catch {}
  };

  const showWelcomeMessage = async () => {
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('frejfund-session-id') : null;
    
    // Try to get readiness from completed deep analysis first
    let readinessScore = 5;
    let useDeepAnalysis = false;
    
    if (sessionId) {
      try {
        const res = await fetch(`/api/deep-analysis?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.analysis?.investmentReadiness) {
            readinessScore = data.analysis.investmentReadiness;
            useDeepAnalysis = true;
          }
        }
      } catch {}
    }
    
    // Fallback to calculated score if deep analysis not available
    if (!useDeepAnalysis) {
      const { calculateReadinessScore } = await import('@/lib/coaching-prompts');
      const readiness = calculateReadinessScore(businessInfo);
      readinessScore = readiness.score;
    }
    
    // Generate welcome with correct score, then override with custom intro
    const { getWelcomeMessage, calculateReadinessScore } = await import('@/lib/coaching-prompts');
    const readiness = { score: readinessScore, nextSteps: [], breakdown: [] as any };
    let welcomeContent = getWelcomeMessage(businessInfo, readiness);

    // Override with the requested custom intro, personalized
    const rawFirstName = (businessInfo as any)?.founderName || (businessInfo as any)?.firstName || (businessInfo as any)?.ownerName || (businessInfo as any)?.contactName || '';
    const firstName = rawFirstName ? String(rawFirstName).split(' ')[0] : (businessInfo.email ? businessInfo.email.split('@')[0] : 'there');
    welcomeContent = `Hi ${firstName}\n\nI’m Freja — your personal investment coach.\nI’m currently analyzing your startup to understand where you stand on your investment journey. \n\nYou can follow the progress in the black banner above — it updates in real time as I process your data.\nOnce the analysis is complete, I’ll guide you step by step through what’s needed to prepare the perfect investor case — from financials to storytelling and everything in between.\n\nWhile I’m working on your analysis, feel free to chat with me about anything related to business, fundraising, or startup strategy. I’m here to help you get investor-ready.`;
    
    const welcomeMessage: Message = {
      id: `msg-welcome-${Date.now()}`,
      content: welcomeContent,
      sender: 'agent',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
    
    // Save welcome message and readiness score to localStorage for session
    if (typeof window !== 'undefined') {
      localStorage.setItem('frejfund-readiness-score', readinessScore.toString());
    }
    
    // Save welcome message to database
    saveMessageToDb(welcomeMessage);
  };

  useEffect(() => {
    // Initial data loading in background
    (async () => {
      try {
        // Prefetch uploaded files (PDF, DOCX, XLSX, CSV, TXT) → text
        let mergedContext: string | null = businessInfo.preScrapedText ? String(businessInfo.preScrapedText) : null;
        try {
          const files = (businessInfo as any).uploadedFiles as File[] | undefined;
          if (files && files.length > 0) {
            const formData = new FormData();
            files.slice(0, 5).forEach((f, idx) => formData.append(`file_${idx}`, f, f.name));
            const res = await fetch('/api/extract', { method: 'POST', headers: { 'x-session-id': sessionId }, body: formData });
            if (res.ok) {
              const { documents } = await res.json();
              const combined = (documents || []).map((d: { text: string }) => d.text).join('\n\n');
              const merged = `${combined}\n\n${mergedContext || ''}`.trim();
              mergedContext = merged ? merged.slice(0, 200000) : null;
            }
          }
        } catch {}
        if (mergedContext) setPrefetchedContext(mergedContext);

        // Fetch proactive tips
        const res = await fetch('/api/proactive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, businessInfo })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tips)) setTips(data.tips);
        }

        // Prefetch a first Daily Compass (non-blocking)
        try {
          const dcRes = await fetch('/api/cron/daily?ui=1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          if (dcRes.ok) {
            const dc = await dcRes.json();
            if (dc && (Array.isArray(dc.insights) || Array.isArray(dc.risks) || Array.isArray(dc.actions))) {
              setDailyCompass({ insights: dc.insights || [], risks: dc.risks || [], actions: dc.actions || [], citations: dc.citations });
              setShowCompass(false);
            }
          }
        } catch {}
        // Trigger deep analysis in background with SSE progress
        try {
          setAnalysisProgress(prev => ({ ...prev, status: 'running' }));
          
          let backoff = 1000;
          let eventSource: EventSource | null = null;

          const handleMessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'progress') {
              setAnalysisProgress({ current: data.current, total: data.total, status: 'running', completedCategories: data.completedCategories || [] });
              backoff = 1000; // reset on data
            } else if (data.type === 'complete') {
              setAnalysisProgress(prev => ({ ...prev, status: 'completed' }));
              try { eventSource && eventSource.close(); } catch {}
              
              // Fetch the actual analysis score
              let scoreMessage = "Deep analysis complete! I now have a comprehensive understanding of your business across 95 dimensions.";
              try {
                const analysisRes = await fetch(`/api/deep-analysis?sessionId=${sessionId}`);
                if (analysisRes.ok) {
                  const analysisData = await analysisRes.json();
                  if (analysisData.overallScore !== undefined) {
                    scoreMessage = `Deep analysis complete! Your overall investment readiness score is ${analysisData.overallScore}/100. I now have a comprehensive understanding of your business across 95 dimensions.`;
                  }
                }
              } catch {}
              
              const completionMessage: Message = {
                id: `analysis-complete-${Date.now()}`,
                content: scoreMessage + " Ask me anything!",
                sender: 'agent',
                timestamp: new Date(),
                type: 'analysis',
                actions: [
                  { type: 'link', label: 'View Full Results', url: '/analysis' }
                ]
              };
              setMessages(prev => [...prev, completionMessage]);
              setShowCompletionCelebration(true);
              setTimeout(() => setShowCompletionCelebration(false), 5000);
              loadDataGaps();
            }
          };

          let offline = !navigator.onLine;
          const connect = () => {
            try { eventSource && eventSource.close(); } catch {}
            if (offline) return;
            eventSource = new EventSource(`/api/deep-analysis/progress?sessionId=${sessionId}`);
            eventSource.onmessage = handleMessage;
            eventSource.onerror = () => {
              try { eventSource && eventSource.close(); } catch {}
              if (offline) return; // wait for online
              setTimeout(connect, backoff);
              backoff = Math.min(backoff * 2, 30000);
            };
          };
          const handleOnline = () => { offline = false; backoff = 1000; connect(); };
          const handleOffline = () => { offline = true; try { eventSource && eventSource.close(); } catch {} };
          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);
          connect();
          
          // Only start analysis if not already triggered or running/completed via SSE
          const analysisKey = `analysis-triggered-${sessionId}`;
          const alreadyTriggered = sessionStorage.getItem(analysisKey);
          const sseStatus = (window as any).__ff_analysis_status as ('idle'|'running'|'completed'|undefined);
          
          if (!alreadyTriggered && sseStatus !== 'running' && sseStatus !== 'completed') {
            sessionStorage.setItem(analysisKey, 'true');
            (window as any).__ff_analysis_status = 'running';
            
            // Enrich businessInfo with user's goal/ambition from localStorage
            let enrichedBusinessInfo = businessInfo;
            try {
              const goalId = localStorage.getItem('frejfund-goal');
              const customGoal = localStorage.getItem('frejfund-custom-goal');
              const roadmapStr = localStorage.getItem('frejfund-roadmap');
              let goalTitle: string | undefined = undefined;
              if (goalId) {
                goalTitle = goalId === 'custom' ? (customGoal || 'Custom goal') : goalId;
              }
              enrichedBusinessInfo = {
                ...businessInfo,
                userAmbition: goalTitle,
                roadmapSummary: roadmapStr ? (() => {
                  try {
                    const r = JSON.parse(roadmapStr);
                    return {
                      goalTitle: r?.goalTitle,
                      targetDate: r?.targetDate,
                      milestones: Array.isArray(r?.milestones) ? r.milestones.map((m: any) => ({ title: m?.title, timeframe: m?.timeframe })) : []
                    };
                  } catch { return undefined; }
                })() : undefined
              } as any;
            } catch {}

            const response = await fetch('/api/deep-analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                businessInfo: enrichedBusinessInfo,
                scrapedContent: mergedContext || '',
                uploadedDocuments: []
              })
            });
            
            try {
              const data = await response.json();
              if (data.already_running) {
                console.log('Deep analysis already running');
              } else {
                console.log('Deep analysis started in background');
              }
            } catch {}
          }
        } catch (error) {
          console.error('Failed to start deep analysis:', error);
          setAnalysisProgress(prev => ({ ...prev, status: 'idle' }));
        }

        // Fetch one-shot summary to seed context (include prefetched docs). Keep it hidden.
        const summaryRes = await fetch('/api/summary', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessInfo,
            websiteText: mergedContext || businessInfo.preScrapedText,
            emails: [],
            kpiPreview: null
          })
        });
         if (summaryRes.ok) { try { await summaryRes.json(); } catch {} }
      } catch {}
    })();
  }, [businessInfo, sessionId]);

  const runDailyCompassNow = async () => {
    setLoadingCompass(true);
    try {
      const res = await fetch('/api/cron/daily?ui=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
      if (res.ok) {
        const dc = await res.json();
        setDailyCompass({ insights: dc.insights || [], risks: dc.risks || [], actions: dc.actions || [], citations: dc.citations });
        setShowCompass(false);
      }
    } catch {}
    setLoadingCompass(false);
  };

  const syncInboxNow = async () => {
    if (syncingInbox) return;
    setSyncingInbox(true);
    try {
      const res = await fetch(`/api/email/sync?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      let indexedEmails = 0; let indexedChunks = 0;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        indexedEmails = Number(data?.result?.indexedEmails || 0);
        indexedChunks = Number(data?.result?.indexedChunks || 0);
        setInsightCard({ text: `New email analyzed: ${indexedEmails} email(s), ${indexedChunks} chunks`, type: 'success' });
        setTimeout(() => setInsightCard(null), 3500);
      }
      // Refresh tips
      try {
        const tipsRes = await fetch('/api/proactive', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, businessInfo }) });
        if (tipsRes.ok) { const d = await tipsRes.json(); if (Array.isArray(d.tips)) setTips(d.tips); setShowTips(true); }
      } catch {}
      // Refresh Daily Compass (with citations)
      try {
        const dcRes = await fetch('/api/cron/daily?ui=1', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });
        if (dcRes.ok) { const dc = await dcRes.json(); setDailyCompass({ insights: dc.insights || [], risks: dc.risks || [], actions: dc.actions || [], citations: dc.citations }); setShowCompass(false); }
      } catch {}
    } catch (e) {
      console.error('Sync inbox failed', e);
    }
    setSyncingInbox(false);
  };

  const addMessage = (content: string, sender: 'user' | 'agent', type: 'text' | 'analysis' | 'summary' = 'text') => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      sender,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Save to database
    saveMessageToDb(newMessage);
  };

  // Try to parse structured JSON from an agent message
  const parseStructured = (content: string): any | null => {
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return null;
      const obj = JSON.parse(match[0]);
      return obj && typeof obj === 'object' ? obj : null;
    } catch {
      return null;
    }
  };

  const StructuredRenderer = ({ data }: { data: any }) => {
    const hasKpis = Array.isArray(data?.kpis);
    const hasPlan = Array.isArray(data?.plan);
    const hasSummary = typeof data?.summary === 'string';
    if (!hasKpis && !hasPlan && !hasSummary) return null;
    return (
      <div className="mt-2 space-y-3">
        {hasSummary && (
          <div className="text-sm text-gray-800 leading-relaxed">{data.summary}</div>
        )}
        {hasKpis && (
          <div className="overflow-x-auto">
            <div className="flex justify-end mb-2 gap-2">
              <button
                className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                onClick={() => {
                  try {
                    const rows = [['KPI','Definition','Target'], ...data.kpis.map((k: any) => [k.name, k.definition, k.target])];
                    const csv = rows.map((r: any[]) => r.map((x: any) => '"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'kpis.csv'; a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }}
              >Export CSV</button>
              <button
                className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                onClick={() => {
                  try {
                    const blob = new Blob([JSON.stringify({ kpis: data.kpis }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'kpis.json'; a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }}
              >Export JSON</button>
            </div>
            <table className="w-full text-xs text-left border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 border-b">KPI</th>
                  <th className="px-3 py-2 border-b">Definition</th>
                  <th className="px-3 py-2 border-b">Target</th>
                </tr>
              </thead>
              <tbody>
                {data.kpis.map((k: any, i: number) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2 border-b align-top text-gray-900">{k.name}</td>
                    <td className="px-3 py-2 border-b text-gray-700">{k.definition}</td>
                    <td className="px-3 py-2 border-b text-gray-700 whitespace-nowrap">{k.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {hasPlan && (
          <div className="text-xs text-gray-800">
            <div className="font-semibold mb-1">90-day plan</div>
            <ol className="list-decimal ml-4 space-y-1">
              {data.plan.map((p: any, i: number) => (
                <li key={i}>
                  <span className="font-medium">{p.title || p.step}</span>
                  {p.owner && <span className="text-gray-600"> • Owner: {p.owner}</span>}
                  {p.timeline && <span className="text-gray-600"> • Timeline: {p.timeline}</span>}
                  {Array.isArray(p.actions) && p.actions.length > 0 && (
                    <ul className="list-disc ml-5 text-gray-700">
                      {p.actions.map((a: string, j: number) => <li key={j}>{a}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  // Ensure readable markdown even if the model forgets formatting
  const formatAsMarkdown = (raw: string): string => {
    try {
      let text = String(raw || '').trim();
      if (!text) return text;

      // 0) Normalize newlines
      text = text.replace(/\r\n/g, '\n');

      // 1) Sanitize bold markers and references
      text = text.replace(/\*{3,}/g, '**');
      text = text.replace(/\[(\d+)\]\*/g, '[$1]');
      text = text.replace(/\*\[(\d+)\]/g, '[$1]');

      // 2) Promote common sections to their own paragraphs
      text = text.replace(/\s*(next\s*steps?\s*:)/gi, '\n\n$1');
      text = text.replace(/\s*(key\s*insights?\s*:)/gi, '\n\n$1');
      text = text.replace(/\s*(recommendations?\s*:)/gi, '\n\n$1');

      // 3) Ensure lists start as separate blocks
      text = text.replace(/\n(\s*)(-\s+)/g, '\n\n$2');
      text = text.replace(/\n(\s*)(\d+\.\s+)/g, '\n\n$2');

      // 4) Split into paragraphs on 2+ newlines, flatten intra-paragraph newlines
      text = text
        .split(/\n{2,}/)
        .map((p: string) => p.replace(/\n+/g, ' ').trim())
        .filter(Boolean)
        .join('\n\n'); // Important: two newlines -> real <p>

      return text.trim();
    } catch {
      return String(raw || '');
    }
  };

  const simulateTyping = async (message: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    setIsTyping(false);
    addMessage(message, 'agent');
  };

  const getAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    const startTs = Date.now();
    
    try {
      const conversationHistory = messages
        .filter(m => m.type !== 'summary')
        .slice(-6)
        .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Attach short context from extracted docs if available in businessInfo
      let docContext: string | undefined = businessInfo.preScrapedText || undefined;
      let scrapedSources: Array<{ url?: string; snippet?: string }> = businessInfo.preScrapedSources || [];
      try {
        const files = (businessInfo as any).uploadedFiles as File[] | undefined;
        if (files && files.length > 0) {
          const formData = new FormData();
          files.slice(0, 3).forEach((f, idx) => formData.append(`file_${idx}`, f, f.name));
          const res = await fetch('/api/extract', { method: 'POST', headers: { 'x-session-id': sessionId }, body: formData });
          if (res.ok) {
            const { documents } = await res.json();
            const combined = (documents || []).map((d: { text: string }) => d.text).join('\n\n');
            const merged = `${combined}\n\n${docContext || ''}`.trim();
            docContext = merged.slice(0, 8000);
          }
        }

        // Scrape website content in background if website provided and no extracted context yet
        if (!docContext && businessInfo.website) {
          try {
            const scrapeRes = await fetch('/api/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: businessInfo.website })
            });
            if (scrapeRes.ok) {
              const { result, sources } = await scrapeRes.json();
              if (result?.text) {
                const merged = `${result.text}\n\n${docContext || ''}`.trim();
                docContext = String(merged).slice(0, 8000);
              }
              if (Array.isArray(sources)) scrapedSources = sources;
            }
          } catch {}
        }
      } catch {}

      // Try streaming endpoint first
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const resp = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, businessInfo, conversationHistory, docContext, sessionId }),
          signal: abortRef.current.signal
        });
        if (!resp.ok || !resp.body) throw new Error('stream failed');

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        const newMsgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setMessages(prev => [...prev, { id: newMsgId, content: '', sender: 'agent', timestamp: new Date(), metrics: {} }]);

        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; abortRef.current?.abort(); }, 30000);
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            acc += chunk;
            // Detect sources sentinel
            const sentinelIdx = acc.indexOf('<<<SOURCES:');
            if (sentinelIdx >= 0) {
              const before = acc.slice(0, sentinelIdx);
              const after = acc.slice(sentinelIdx);
              const endIdx = after.indexOf('>>>');
              if (endIdx >= 0) {
                const jsonStr = after.slice('<<<SOURCES:'.length, endIdx);
                try {
                  const sources = JSON.parse(jsonStr);
                  const evidence = Array.isArray(sources) ? sources.map((s: any) => ({ source: 'website' as const, snippet: String(s.snippet || '').slice(0, 200), url: s.url })) : undefined;
                  const latencyMs = Date.now() - startTs;
                  const tokensEstimate = Math.ceil((before.length + (acc.length)) / 4);
                  const price = { input: Number(process.env.MODEL_PRICE_INPUT_PER_MTOK || 0), output: Number(process.env.MODEL_PRICE_OUTPUT_PER_MTOK || 0) };
                  const mtok = tokensEstimate / 1_000_000;
                  const costUsdEstimate = (price.output || 0) * mtok;
                  const finalContent = `${before.trim()}`.trim();
                  const mergedEvidence = (evidence && evidence.length ? evidence : (scrapedSources.length ? scrapedSources.map((s) => ({ source: 'website' as const, snippet: String(s.snippet || '').slice(0, 200), url: s.url })) : undefined));
                  updateMessageWithMetrics(newMsgId, { content: finalContent, evidence: mergedEvidence, metrics: { latencyMs, tokensEstimate, costUsdEstimate } });
                } catch {
                  const latencyMs = Date.now() - startTs;
                  const tokensEstimate = Math.ceil((before.length + (acc.length)) / 4);
                  const price = { input: Number(process.env.MODEL_PRICE_INPUT_PER_MTOK || 0), output: Number(process.env.MODEL_PRICE_OUTPUT_PER_MTOK || 0) };
                  const mtok = tokensEstimate / 1_000_000;
                  const costUsdEstimate = (price.output || 0) * mtok;
                  const finalContent = `${before.trim()}`.trim();
                  const mergedEvidence = (scrapedSources.length ? scrapedSources.map((s) => ({ source: 'website' as const, snippet: String(s.snippet || '').slice(0, 200), url: s.url })) : undefined);
                  updateMessageWithMetrics(newMsgId, { content: finalContent, evidence: mergedEvidence, metrics: { latencyMs, tokensEstimate, costUsdEstimate } });
                }
                acc = '';
              }
            } else {
              setMessages(prev => prev.map(m => m.id === newMsgId ? { ...m, content: (m.content + chunk).trimStart() } : m));
            }
          }
        } finally {
          clearTimeout(timer);
        }
      } catch (streamErr) {
        // Fallback to non-streaming
      // Non-streaming fallback with simple retry and soft messaging on 502
      const doOnce = async () => fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          businessInfo,
          conversationHistory,
            docContext,
            sessionId
        })
      });

      let response = await doOnce();
      if (!response.ok) {
        // quick second attempt
        await new Promise(r=>setTimeout(r, 400));
        response = await doOnce();
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('AI API error:', response.status, errText);
        setIsTyping(false);
        setMessages(prev => ([
          ...prev,
          {
            id: `ai-failed-${Date.now()}`,
            sender: 'agent',
            content: 'Analysis is heavy right now. I switched to a lighter mode — ask one question and I will answer briefly while the deep analysis continues.',
            timestamp: new Date(),
            type: 'text'
          }
        ]));
        return;
      }

      const data = await response.json();
        // Optionally attach simple evidence: if we scraped, include a tiny snippet reference
        const apiSources = (data.sources && Array.isArray(data.sources) && data.sources.length) ? data.sources : scrapedSources;
        const evidence = (apiSources && apiSources.length)
          ? apiSources.map((s: any) => ({ source: 'website' as const, snippet: String(s.snippet || '').slice(0, 200), url: s.url }))
          : (docContext ? [{ source: 'website' as const, snippet: String(docContext).slice(0, 200) }] : undefined);
        const newMsgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const latencyMs = Date.now() - startTs;
          const tokensEstimate = Math.ceil((data.response.length) / 4);
          const model = getChatModel('complex'); // Chat now uses gpt-5
        const { getModelPricing } = await import('@/lib/ai-client');
        const price = getModelPricing(model);
        const mtok = tokensEstimate / 1_000_000;
        const costUsdEstimate = (price.output || 0) * mtok;
        const newMessage: Message = { id: newMsgId, content: `${data.response}`.trim(), sender: 'agent', timestamp: new Date(), evidence, metrics: { latencyMs, tokensEstimate, costUsdEstimate }, type: 'text' };
        setMessages(prev => [...prev, newMessage]);
        saveMessageToDb(newMessage);
      }
      setIsTyping(false);
    } catch (error) {
      console.error('AI Response failed:', error);
      setIsTyping(false);
      // Fallback to local responses
      await simulateTyping(getFallbackResponse(userMessage));
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('competitor') || lowerMessage.includes('competition')) {
      return `Based on your ${businessInfo.industry} business in the ${businessInfo.targetMarket} market, I can help you analyze your competitive landscape. Let me gather some insights about your main competitors and differentiation strategies.`;
    } else if (lowerMessage.includes('funding') || lowerMessage.includes('investment')) {
      const fundingAdvice = businessInfo.stage === 'idea' 
        ? 'As an idea-stage startup, focus on pre-seed funding from angels. Target €100K-500K to validate your concept and build an MVP.'
        : businessInfo.stage === 'mvp'
        ? 'With an MVP, you\'re ready for seed funding. Look for €500K-2M to prove product-market fit and gain initial traction.'
        : 'Given your current stage, consider Series A funding to scale your go-to-market strategy and expand your team.';
      return fundingAdvice;
    } else if (lowerMessage.includes('team') || lowerMessage.includes('hiring')) {
      const teamAdvice = businessInfo.teamSize === '1' 
        ? 'As a solo founder, consider bringing on a co-founder with complementary skills. Look for someone with domain expertise in sales, marketing, or technical development depending on your background.'
        : `With a team of ${businessInfo.teamSize}, focus on scaling key roles. For ${businessInfo.industry} companies, typically sales and engineering are critical hires at your stage.`;
      return teamAdvice;
    } else {
      const responses = [
        `That's a great question about your ${businessInfo.industry} startup. Let me think about how this applies to your ${businessInfo.stage} stage business...`,
        `Interesting point! For a ${businessInfo.businessModel} company targeting ${businessInfo.targetMarket}, I'd recommend...`,
        `Based on your business context, here's what I think about that...`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const sessionId = localStorage.getItem('frejfund-session-id');
    
    setInsightCard({ text: `Uploading ${file.name}...`, type: 'info' });
    
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'x-session-id': sessionId || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: file.name.includes('pitch') || file.name.includes('deck') ? 'pitch_deck' : 
                file.name.includes('financial') || file.name.includes('model') ? 'financial_model' : 'other',
          title: file.name,
          content: await file.text(),
          status: 'uploaded'
        })
      });
      
      if (response.ok) {
        setInsightCard({ text: `${file.name} uploaded. Analyzing to improve your profile...`, type: 'success' });
        setTimeout(() => setInsightCard(null), 3000);
      } else {
        setInsightCard({ text: 'Upload failed. Please try again.', type: 'warning' });
        setTimeout(() => setInsightCard(null), 3000);
      }
    } catch (error) {
      console.error('File upload error:', error);
      setInsightCard({ text: 'Upload failed. Please try again.', type: 'warning' });
      setTimeout(() => setInsightCard(null), 3000);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addMessage(userMessage, 'user');
    setInputValue('');

    // Handle analysis requests specially
    if (userMessage.toLowerCase().includes('analysis') || userMessage.toLowerCase().includes('analyze')) {
      await simulateTyping('Perfect! I\'ll run a comprehensive business analysis for you. This will take a few minutes as I analyze your business model, market opportunity, team capabilities, and generate personalized insights.');
      
      setTimeout(() => {
        setShowAnalysisModal(true);
      }, 1000);
    } else {
      // Use AI for all other responses
      await getAIResponse(userMessage);
    }
  };

  const handleAnalysisComplete = (result: BusinessAnalysisResult) => {
    setShowAnalysisModal(false);
    setAnalysisResult(result);
    
    addMessage(
      `Analysis complete! I've evaluated your ${businessInfo.industry} business across 10 key dimensions with ${result.accuracy}% accuracy. Your overall investment readiness score is ${result.scores.overallScore}/100. Here are my key insights and recommendations.`,
      'agent',
      'analysis'
    );

    setTimeout(() => {
      setShowResultsModal(true);
    }, 1000);
  };

  // Rotating question suggestions based on business context
  const getContextualQuestions = () => {
    const baseQuestions = [
      "What should my next milestone be in the next 90 days?",
      "How can I improve my pitch to investors?",
      "What are the biggest risks for my business right now?",
      "How should I price my product or service?",
      "What metrics should I be tracking at my stage?",
      "How can I differentiate from my competitors?",
      "What's my ideal customer acquisition strategy?",
      "When should I start fundraising?",
      "How can I validate my market demand?",
      "What team members should I hire next?"
    ];

    const stageSpecificQuestions = {
      'idea': [
        "How do I validate my business idea with potential customers?",
        "What's the minimum viable product I should build first?",
        "How much money do I need to get started?",
        "Should I find a co-founder or go solo?",
        "What legal structure should I choose for my startup?"
      ],
      'mvp': [
        "How do I get my first 100 customers?",
        "What features should I prioritize in my next version?",
        "How do I know if I have product-market fit?",
        "When should I start charging customers?",
        "How can I improve my user onboarding?"
      ],
      'early-revenue': [
        "How can I scale my customer acquisition?",
        "What's my path to profitability?",
        "How do I improve my unit economics?",
        "When should I expand to new markets?",
        "How can I reduce customer churn?"
      ],
      'scaling': [
        "How do I prepare for Series A funding?",
        "What's my international expansion strategy?",
        "How can I build a scalable sales process?",
        "What operational systems do I need?",
        "How do I maintain company culture while growing?"
      ]
    };

    const industrySpecificQuestions: Record<string, string[]> = {
      'SaaS': [
        "How can I improve my SaaS metrics (CAC, LTV, churn)?",
        "What's the best pricing model for my SaaS product?",
        "How do I build a scalable customer success program?"
      ],
      'E-commerce': [
        "How can I improve my conversion rate and AOV?",
        "What's the best customer acquisition strategy for e-commerce?",
        "How do I optimize my inventory management?"
      ],
      'Fintech': [
        "What regulatory requirements do I need to consider?",
        "How do I build trust with financial service customers?",
        "What's my path to financial licenses?"
      ]
    };

    // Combine questions based on context
    let allQuestions = [...baseQuestions];
    
    if (stageSpecificQuestions[businessInfo.stage]) {
      allQuestions = [...allQuestions, ...stageSpecificQuestions[businessInfo.stage]];
    }
    
    if (industrySpecificQuestions[businessInfo.industry]) {
      allQuestions = [...allQuestions, ...industrySpecificQuestions[businessInfo.industry]];
    }

    return allQuestions;
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [rotatingQuestions] = useState(getContextualQuestions());
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  // Shorter placeholders for input field
  const placeholderQuestions = [
    "Ask anything...",
    "What should I focus on next?",
    "How do I grow faster?",
    "Am I ready to fundraise?",
    "What metrics matter most?",
    "How can I reduce churn?",
    "Should I hire?",
    "Improve my pitch?"
  ];

  // Rotate questions every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestionIndex(prev => (prev + 1) % rotatingQuestions.length);
      setCurrentPlaceholderIndex(prev => (prev + 1) % placeholderQuestions.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [rotatingQuestions.length, placeholderQuestions.length]);

  const quickActions = [
    {
      icon: Brain,
      label: 'Full Analysis',
      action: () => {
        addMessage('Please run a comprehensive business analysis', 'user');
        handleSendMessage();
      }
    },
    {
      icon: TrendingUp,
      label: 'Market Analysis',
      action: () => {
        addMessage('Analyze my market opportunity and competition', 'user');
        handleSendMessage();
      }
    },
    {
      icon: FileText,
      label: 'Pitch Review',
      action: () => {
        addMessage('Help me improve my pitch deck and presentation', 'user');
        handleSendMessage();
      }
    },
    {
      icon: BarChart3,
      label: 'Funding Strategy',
      action: () => {
        addMessage('What\'s the best funding strategy for my stage?', 'user');
        handleSendMessage();
      }
    }
  ];

  // Show loading state while fetching message history
  if (isLoadingHistory) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between"
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          <motion.div 
            className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => window.location.href = '/dashboard'}
          >
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
          </motion.div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-black">Freja</h1>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
              <p className="text-[10px] sm:text-xs text-gray-500">
                {analysisProgress.status === 'running' ? (
                  <span className="flex items-center relative group">
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="mr-2"
                    >
                      Analyzing deeply...
                    </motion.span>
                    <span className="text-black font-medium">
                      {analysisProgress.current}/{analysisProgress.total}
                    </span>
                    <span className="ml-1 text-gray-400">
                      ({Math.round((analysisProgress.current / analysisProgress.total) * 100)}%)
                    </span>
                    <Info className="w-3 h-3 ml-1.5 text-gray-400 cursor-help" />
                    
                    {/* Tooltip - appears below the icon */}
                    <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-white text-black text-xs rounded-xl shadow-2xl border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                      <div className="font-bold mb-2 text-sm">Deep Analysis in Progress</div>
                      <div className="space-y-2 text-gray-800">
                        <p className="font-semibold">Analyzing 95 dimensions:</p>
                        <p>• Market opportunity & competition</p>
                        <p>• Team strength & execution</p>
                        <p>• Financial health & metrics</p>
                        <p>• Product-market fit signals</p>
                        <p>• Investment readiness</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="font-medium text-gray-900">Data sources:</p>
                        <p className="text-gray-700">Website, LinkedIn, GitHub, Product Hunt, documents</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 rounded-lg p-2 -mx-1 bg-gray-50">
                        <p className="font-bold text-gray-900">15-30 minutes</p>
                        <p className="text-gray-700 text-[10px]">Optimized for cost with gpt-5-mini</p>
                      </div>
                      {/* Arrow pointing up */}
                      <div className="absolute -top-2 left-4 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent border-b-white"></div>
                    </div>
                  </span>
                ) : dataGaps && dataGaps.totalGaps > 0 ? (
                  <span className="flex items-center gap-1">
                    <span>Active now</span>
                    <span className="text-yellow-600 font-medium ml-2">
                      · {dataGaps.totalGaps} {dataGaps.totalGaps === 1 ? 'gap' : 'gaps'} to fill
                    </span>
                  </span>
                ) : (
                  'Active now'
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative">
            <button
              onClick={() => setShowInfoPopup((v) => !v)}
              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Company info"
            >
              <Info className="w-3.5 h-3.5 text-gray-600" />
            </button>
            {showInfoPopup && (
              <div className="absolute right-0 top-9 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-xs">
                <div className="font-semibold text-black mb-1">{businessInfo.name}</div>
                <div className="text-gray-600">{businessInfo.industry} • {businessInfo.stage} stage</div>
                <div className="text-gray-600">Targeting {businessInfo.targetMarket}</div>
                <div className="text-gray-600 mt-1">{businessInfo.businessModel}</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowTips((v) => !v)}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors relative"
            title="Proactive tips"
          >
            <Lightbulb className="w-3.5 h-3.5 text-gray-600" />
            {tips.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full text-white text-[9px] flex items-center justify-center">{tips.length}</span>
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="font-semibold text-black">VC Interest</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-black mb-1">
                              🎉 {notif.vcFirm} is interested!
                            </div>
                            <div className="text-xs text-gray-600 mb-3">
                              {notif.message}
                            </div>
                          </div>
                          {notif.matchScore && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">
                              {notif.matchScore}%
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {notif.status === 'pending' ? (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await fetch('/api/notifications/respond', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        requestId: notif.id,
                                        response: 'accept',
                                        message: 'Yes, I\'d love to connect!'
                                      })
                                    });
                                    loadNotifications();
                                    setShowNotifications(false);
                                    addMessage(`Great news! I've accepted the intro request from ${notif.vcFirm}. You can now message them directly!`, 'agent');
                                  } catch (error) {
                                    console.error('Error accepting intro:', error);
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await fetch('/api/notifications/respond', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        requestId: notif.id,
                                        response: 'decline',
                                        message: 'Not interested right now'
                                      })
                                    });
                                    loadNotifications();
                                  } catch (error) {
                                    console.error('Error declining intro:', error);
                                  }
                                }}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          ) : notif.status === 'accepted' ? (
                            <button
                              onClick={() => {
                                setActiveMatchChat({
                                  introRequestId: notif.id,
                                  vcName: notif.vcName,
                                  vcFirm: notif.vcFirm
                                });
                                setShowMatchChat(true);
                                setShowNotifications(false);
                              }}
                              className="flex-1 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                            >
                              💬 Message
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="What can Freja help with?"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDataMenu((v) => !v)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Data & tools"
            >
              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
            </button>
            {showDataMenu && (
              <div className="absolute right-0 top-9 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button onClick={async ()=>{ setShowDataMenu(false); await syncInboxNow(); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors disabled:opacity-50" disabled={syncingInbox}>
                  {syncingInbox ? 'Syncing Inbox…' : 'Sync Inbox now'}
                </button>
                <button onClick={()=>{setShowEmailModal(true); setShowDataMenu(false);}} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors">Add single email…</button>
                <button onClick={()=>{setShowKpiModal(true); setShowDataMenu(false);}} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors">KPI CSV</button>
                <button onClick={()=>{setShowDeckModal(true); setShowDataMenu(false);}} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors">Pitch Deck</button>
              </div>
            )}
          </div>
        </div>
      </motion.header>


      {/* Thinking progress bar */}
      <div className="h-1 w-full bg-gray-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${thinkingProgress}%` }}
          transition={{ duration: 0.15 }}
          className={`h-full ${thinkingProgress > 0 ? 'bg-black' : 'bg-transparent'}`}
        />
      </div>

      {/* Pinned Daily Compass */}
      {showCompass && dailyCompass && (
        <div className="px-6 pt-4">
          <div className="max-w-4xl mx-auto mb-4 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-black">Daily Compass</div>
              <div className="flex items-center gap-2">
                <button onClick={runDailyCompassNow} disabled={loadingCompass} className={`px-3 py-1.5 text-xs rounded-lg ${loadingCompass ? 'bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-gray-800'} transition-colors`}>
                  {loadingCompass ? 'Updating…' : 'Run now'}
                </button>
                <button onClick={() => setShowCompass(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:text-black">Dismiss</button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 p-4">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Insights</div>
                <ul className="space-y-1 list-disc ml-4 text-sm text-gray-800">
                  {(dailyCompass.insights || []).slice(0,3).map((t, i) => <li key={`ins-${i}`}>{t}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Risks</div>
                <ul className="space-y-1 list-disc ml-4 text-sm text-gray-800">
                  {(dailyCompass.risks || []).slice(0,3).map((t, i) => <li key={`risk-${i}`}>{t}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Actions</div>
                <ul className="space-y-1 list-disc ml-4 text-sm text-gray-800">
                  {(dailyCompass.actions || []).slice(0,3).map((t, i) => <li key={`act-${i}`}>{t}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3 max-w-3xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex items-start space-x-2 sm:space-x-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'agent' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-6 h-6 sm:w-8 sm:h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 relative"
                >
                  <motion.div 
                    className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full"
                    animate={isTyping ? { 
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.7, 1]
                    } : {}}
                    transition={{ 
                      duration: 1.5, 
                      repeat: isTyping ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              )}
              
              <div className={`max-w-[85%] sm:max-w-md ${message.sender === 'user' ? 'order-1' : ''}`}>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 group relative overflow-hidden ${
                      message.sender === 'user'
                        ? 'bg-black text-white rounded-2xl rounded-br-sm text-sm sm:text-base'
                        : message.type === 'analysis'
                        ? 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200 text-sm sm:text-base'
                        : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm text-sm sm:text-base'
                    }`}
                  >
                  {/* Subtle gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 pointer-events-none"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  {message.sender === 'agent' && parseStructured(message.content) ? (
                    <StructuredRenderer data={parseStructured(message.content)} />
                  ) : message.sender === 'agent' ? (
                    <div className="text-sm leading-relaxed max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({children}) => (
                            <p className="mb-2 sm:mb-2.5 leading-relaxed text-gray-800">{children}</p>
                          ),
                          ul: ({children}) => (
                            <ul className="my-2 pl-4 list-disc space-y-1 text-gray-800">{children}</ul>
                          ),
                          ol: ({children}) => (
                            <ol className="my-2 pl-4 list-decimal space-y-1 text-gray-800">{children}</ol>
                          ),
                          li: ({children}) => <li className="mb-1">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-black">{children}</strong>,
                          h2: ({children}) => <h2 className="text-sm font-semibold text-black mt-2 mb-1">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold text-black mt-2 mb-1">{children}</h3>,
                        }}
                      >
                        {formatAsMarkdown(message.content)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  {message.sender === 'agent' && (
                    <div className="relative z-10 mt-2 flex items-center space-x-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      {message.evidence && message.evidence.length > 0 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEvidence(prev => ({ ...prev, [message.id]: !prev[message.id] }));
                            }}
                            className="text-xs text-gray-600 hover:text-black inline-flex items-center cursor-pointer"
                            title="Toggle evidence"
                          >
                            <BookOpen className="w-3 h-3 mr-1" /> Sources
                          </button>
                          <span className="text-gray-300">|</span>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingFeedback({ messageId: message.id, rating: 'up' });
                        }}
                        className="text-xs text-gray-600 hover:text-black inline-flex items-center cursor-pointer"
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingFeedback({ messageId: message.id, rating: 'down' });
                        }}
                        className="text-xs text-gray-600 hover:text-black inline-flex items-center cursor-pointer"
                        title="Needs work"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {showEvidence[message.id] && message.evidence && message.evidence.length > 0 && (
                    <div className="relative z-10 mt-2 p-2 bg-white border border-gray-300 rounded shadow-sm">
                      {message.evidence.map((e, i) => (
                        <div key={i} className="text-xs text-gray-600">
                          <span className="font-medium">{e.source}:</span> {e.snippet}
                          {e.url && (
                            <>
                              {' '}
                              <a href={e.url} target="_blank" rel="noreferrer" className="underline text-gray-700 hover:text-black">[link]</a>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Render action buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (action.type === 'link' && action.url) {
                              window.location.href = action.url;
                            } else if (action.action === 'show-results' && analysisResult) {
                              setShowResultsModal(true);
                            } else if (action.action === 'openGapFilling') {
                              setShowGapFilling(true);
                            }
                          }}
                          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            action.variant === 'primary' 
                              ? 'bg-black text-white hover:bg-gray-800' 
                              : 'bg-gray-100 text-black hover:bg-gray-200'
                          }`}
                        >
                          {action.label}
                          {action.type === 'link' && <TrendingUp className="w-3 h-3 ml-1" />}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {message.type === 'analysis' && lastGap && lastGap.messageId === message.id && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => { setInputValue(lastGap.question); try { inputRef.current?.focus(); } catch {} }}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-full hover:border-black"
                      >
                        Answer here
                      </button>
                      <button
                        onClick={() => { try { fileInputRef.current?.click(); } catch {} }}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-full hover:border-black"
                      >
                        Upload file
                      </button>
                      <button
                        onClick={async () => {
                          const msg = `Guide me to collect the data for ${lastGap.dimensionName}.`;
                          addMessage(msg, 'user');
                          await getAIResponse(msg);
                        }}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-full hover:border-black"
                      >
                        Guide me
                      </button>
                    </div>
                  )}
                </motion.div>
                <div className="mt-1 text-xs text-gray-500 px-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {message.metrics && (
                    <>
                      {' '}
                      · {message.metrics.latencyMs ? `${Math.round(message.metrics.latencyMs)}ms` : ''}
                      {message.metrics.tokensEstimate ? ` · ~${message.metrics.tokensEstimate} tok` : ''}
                      {typeof message.metrics.costUsdEstimate === 'number' ? ` · ~$${message.metrics.costUsdEstimate.toFixed(4)}` : ''}
                    </>
                  )}
                </div>
              </div>

              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start space-x-3"
            >
            <motion.div className="relative">
              {/* Animated pulse rings */}
              <motion.div
                className="absolute inset-0 bg-black rounded-full"
                animate={{ 
                  scale: [1, 1.5, 2],
                  opacity: [0.4, 0.2, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 bg-black rounded-full"
                animate={{ 
                  scale: [1, 1.5, 2],
                  opacity: [0.4, 0.2, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
              <motion.div 
                className="relative w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg overflow-hidden"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/freja.png" alt="Freja" className="w-full h-full object-cover" />
              </motion.div>
            </motion.div>
            
            <motion.div
              className="bg-gray-50 border border-gray-200 px-6 py-3.5 rounded-2xl shadow-sm backdrop-blur-sm"
              animate={{ 
                boxShadow: [
                  "0 1px 3px rgba(0,0,0,0.1)",
                  "0 10px 20px rgba(0,0,0,0.1)",
                  "0 1px 3px rgba(0,0,0,0.1)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="relative"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gray-400 rounded-full blur-sm"
                        animate={{ 
                          scale: [0, 2, 0],
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          delay,
                          ease: "easeOut"
                        }}
                      />
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          delay,
                          ease: "easeInOut"
                        }}
                        className="relative w-2.5 h-2.5 bg-gray-600 rounded-full"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Right panel: Proactive tips */}
      {showTips && (
        <div className="fixed right-4 top-20 bottom-20 w-80 bg-white border border-gray-200 rounded-xl shadow p-4 overflow-y-auto z-30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-black">Proactive tips</div>
            <button onClick={() => setShowTips(false)} className="text-xs text-gray-600 hover:text-black">Close</button>
          </div>
          {tips.length === 0 ? (
            <div className="text-xs text-gray-500">No tips yet.</div>
          ) : (
            <div className="space-y-3">
              {tips.map((t, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{t.priority?.toUpperCase() || 'MEDIUM'}</div>
                  <div className="text-sm font-medium text-black">{t.title}</div>
                  {t.why && <div className="text-xs text-gray-700 mt-1">Why: {t.why}</div>}
                  {t.action && <div className="text-xs text-gray-700 mt-1">Action: {t.action}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insight Card */}
      <AnimatePresence>
        {insightCard && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <motion.div 
              className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-3 ${
                insightCard.type === 'success' ? 'bg-green-50 border-2 border-green-200' :
                insightCard.type === 'warning' ? 'bg-yellow-50 border-2 border-yellow-200' :
                'bg-blue-50 border-2 border-blue-200'
              }`}
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="text-2xl"
              >
                {insightCard.type === 'success' ? '✨' : 
                 insightCard.type === 'warning' ? '⚡' : '💡'}
              </motion.span>
              <span className={`font-medium ${
                insightCard.type === 'success' ? 'text-green-800' :
                insightCard.type === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {insightCard.text}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Quick Questions Button */}
      <AnimatePresence>
        {!showQuickQuestions && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickQuestions(true)}
            className="fixed bottom-24 sm:bottom-28 left-4 sm:left-6 w-12 h-12 sm:w-14 sm:h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors z-40"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-xl sm:text-2xl"
            >
              ?
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Questions Popover */}
      <AnimatePresence>
        {showQuickQuestions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setShowQuickQuestions(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-24 sm:bottom-40 left-3 sm:left-6 right-3 sm:right-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 z-40"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-black">Quick Questions</h3>
                <button
                  onClick={() => setShowQuickQuestions(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                {(() => {
                  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
                  let suggestions = [];
                  
                  if (lastMessage.includes('growth') || lastMessage.includes('revenue')) {
                    suggestions = [
                      "What's my best growth channel?",
                      "How do I scale customer acquisition?",
                      "Show me pricing strategies",
                      "Start intelligent search"
                    ];
                  } else if (lastMessage.includes('funding') || lastMessage.includes('invest')) {
                    suggestions = [
                      "Am I ready to fundraise?",
                      "What's my valuation range?",
                      "Create investor pitch",
                      "Start intelligent search"
                    ];
                  } else if (lastMessage.includes('team') || lastMessage.includes('hire')) {
                    suggestions = [
                      "Who should I hire next?",
                      "Build compensation plan",
                      "Create org structure",
                      "Start intelligent search"
                    ];
                  } else {
                    suggestions = [
                      "How do I grow faster?",
                      "Start intelligent search",
                      "What's my biggest risk?",
                      "When should I fundraise?",
                      "Help me with my pitch deck",
                      "What metrics should I track?"
                    ];
                  }
                  
                  return suggestions;
                })().map((question, index) => (
                  <motion.button
                    key={question}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: "#f9fafb" }}
                    onClick={() => {
                      if (question.toLowerCase().includes('intelligent search')) {
                        setShowIntelligentSearch(true);
                        setShowQuickQuestions(false);
                      } else {
                        setInputValue(question);
                        inputRef.current?.focus();
                        setShowQuickQuestions(false);
                        
                        setInsightCard({
                          text: "Great question! Let me analyze this for you...",
                          type: 'info'
                        });
                        setTimeout(() => setInsightCard(null), 3000);
                      }
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm text-gray-700 hover:text-black transition-all"
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Click any question to ask Freja
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Input */}
      <motion.div 
        className="px-3 sm:px-6 py-3 sm:py-4 bg-white backdrop-blur-xl border-t border-gray-100 relative z-[60]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl p-6 shadow-2xl">
              <Upload className="w-8 h-8 mx-auto mb-2 text-black" />
              <p className="text-sm font-medium text-black">Drop file to upload</p>
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-2 sm:space-x-3">
            {/* File upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.key,.txt"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              title="Upload document"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </motion.button>

            <motion.div 
              className="flex-1 relative"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {/* Pulsing glow effect when ready */}
              {!isTyping && (
                <motion.div
                  className="absolute -inset-0.5 bg-gray-400 rounded-full blur opacity-20"
                  animate={{ 
                    scale: [1, 1.02, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={placeholderQuestions[currentPlaceholderIndex]}
              className="relative w-full px-4 sm:px-5 py-2.5 sm:py-3.5 pr-12 sm:pr-14 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder-gray-400 text-sm sm:text-[15px] z-10"
            />
              {isTyping ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => abortRef.current?.abort()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    inputValue.trim() 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
            </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <BusinessAnalysisModal
            businessInfo={businessInfo}
            onComplete={handleAnalysisComplete}
            onClose={() => setShowAnalysisModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Results Modal */}
      {/* Email Ingest Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <EmailIngestModal sessionId={sessionId} onClose={() => setShowEmailModal(false)} onIngest={async (email)=>{
            try {
              const summaryRes = await fetch('/api/summary', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessInfo, websiteText: businessInfo.preScrapedText, emails: [email], kpiPreview: null })
              });
              if (summaryRes.ok) {
                const s = await summaryRes.json();
                const note = `New email ingested. Updated context: ${s.summary}`;
                addMessage(note, 'agent');
                const tipsRes = await fetch('/api/proactive', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId, businessInfo }) });
                if (tipsRes.ok){ const d = await tipsRes.json(); if (Array.isArray(d.tips)) setTips(d.tips); }
              }
            } catch {}
          }} />
        )}
      </AnimatePresence>
      {/* KPI Upload Modal */}
      <AnimatePresence>
        {showKpiModal && (
          <KpiUploadModal onClose={() => setShowKpiModal(false)} initialCsv={businessInfo.demoKpiCsv} />
        )}
      </AnimatePresence>
      {/* Deck Summary Modal */}
      <AnimatePresence>
        {showDeckModal && (
          <DeckSummaryModal businessInfo={businessInfo} onClose={() => setShowDeckModal(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showResultsModal && analysisResult && (
          <ResultsModal
            result={analysisResult}
            businessInfo={businessInfo}
            onClose={() => setShowResultsModal(false)}
          />
        )}
      </AnimatePresence>
      {/* Feedback Modal */}
      <AnimatePresence>
        {pendingFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-2">Feedback</h3>
              <p className="text-sm text-gray-600 mb-4">Why?</p>
              <textarea
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                placeholder="What was good or missing?"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black mb-3"
                rows={3}
              />
              <p className="text-sm text-gray-600 mb-2">What was missing?</p>
              <input
                value={feedbackMissing}
                onChange={(e) => setFeedbackMissing(e.target.value)}
                placeholder="E.g. more numbers, examples, clearer plan"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setPendingFeedback(null);
                    setFeedbackReason('');
                    setFeedbackMissing('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          messageId: pendingFeedback.messageId,
                          sessionId,
                          rating: pendingFeedback.rating === 'up' ? 'up' : 'down',
                          reason: feedbackReason || undefined,
                          missing: feedbackMissing || undefined
                        })
                      });
                    } catch {}
                    setPendingFeedback(null);
                    setFeedbackReason('');
                    setFeedbackMissing('');
                    addMessage('Thanks for your feedback! We use it to improve responses.', 'agent');
                    // Auto-regenerate on thumbs down with constraints
                    if (pendingFeedback.rating === 'down') {
                      const constraints: string[] = [];
                      if (feedbackMissing) constraints.push(`Please add: ${feedbackMissing}.`);
                      if (feedbackReason) constraints.push(`Consider this critique: ${feedbackReason}.`);
                      const regenPrompt = `Regenerate the previous answer with these constraints. Be concise, cite sources as [1], [2] if applicable. ${constraints.join(' ')}`.trim();
                      addMessage(regenPrompt, 'user');
                      await getAIResponse(regenPrompt);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Match Chat */}
      {showMatchChat && activeMatchChat && (
        <MatchChat
          introRequestId={activeMatchChat.introRequestId}
          userEmail={businessInfo.email || ''}
          userType="founder"
          matchName={`${activeMatchChat.vcName} (${activeMatchChat.vcFirm})`}
          onClose={() => setShowMatchChat(false)}
        />
      )}

      {/* Intelligent Search Modal */}
      <AnimatePresence>
        {showIntelligentSearch && (
          <IntelligentSearchModal
            businessInfo={businessInfo}
            onComplete={(analysis, conversationState) => {
              setShowIntelligentSearch(false);
              
              // Add the analysis to chat
              addMessage(
                `I've completed an intelligent discovery session with you! Here's my comprehensive analysis:\n\n${analysis}`,
                'agent',
                'analysis'
              );
              
              // Show success notification
              setInsightCard({
                text: `Discovery complete! Gathered ${conversationState.knownFacts.length} key insights with ${conversationState.confidenceScore}% confidence.`,
                type: 'success'
              });
              setTimeout(() => setInsightCard(null), 4000);
            }}
            onClose={() => setShowIntelligentSearch(false)}
          />
        )}
      </AnimatePresence>

      {/* Gap Filling Modal */}
      {showGapFilling && gapFillingData && (
        <GapFillingModal
          isOpen={showGapFilling}
          onClose={() => setShowGapFilling(false)}
          gaps={transformGapsForModal(gapFillingData)}
          onSubmit={handleGapSubmit}
        />
      )}

      {/* Completion Celebration */}
      <AnimatePresence>
        {showCompletionCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed inset-x-0 top-24 mx-auto max-w-lg z-50 pointer-events-none"
          >
            <div className="mx-4">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-black text-white rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden"
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: [-400, 400] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 bg-black rounded-full"
                    />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold mb-2">Analysis Complete!</h3>
                  <p className="text-sm text-gray-300">
                    I've analyzed your business across 95 dimensions and am ready to be your smartest investment coach.
                  </p>
                  
                  {/* Animated dots */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
