'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, CheckCircle2, Brain } from 'lucide-react';
import { BusinessInfo } from '@/types/business';
import { intelligentSearch, IntelligentQuestion, ConversationState } from '@/lib/intelligent-search';

interface IntelligentSearchModalProps {
  businessInfo: BusinessInfo;
  onComplete: (analysis: string, conversationState: ConversationState) => void;
  onClose: () => void;
}

export default function IntelligentSearchModal({ 
  businessInfo, 
  onComplete, 
  onClose 
}: IntelligentSearchModalProps) {
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<IntelligentQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<string | null>(null);
  
  // Initialize conversation on mount
  useEffect(() => {
    const initState = intelligentSearch.initializeConversation(businessInfo);
    setConversationState(initState);
    loadNextQuestion(initState);
  }, [businessInfo]);
  
  const loadNextQuestion = async (state: ConversationState) => {
    setIsProcessing(true);
    try {
      const nextQ = await intelligentSearch.getNextQuestion(state, businessInfo);
      
      if (!nextQ) {
        // No more questions - generate final analysis
        await completeSurvey(state);
        return;
      }
      
      setCurrentQuestion(nextQ);
    } catch (error) {
      console.error('Error loading next question:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion || !conversationState) return;
    
    setIsProcessing(true);
    
    try {
      // Process the answer and update state
      const updatedState = await intelligentSearch.processAnswer(
        conversationState,
        currentQuestion,
        userAnswer,
        businessInfo
      );
      
      setConversationState(updatedState);
      setUserAnswer('');
      
      // Check if we're done
      if (intelligentSearch.isReadyForAnalysis(updatedState)) {
        await completeSurvey(updatedState);
      } else {
        // Load next question
        await loadNextQuestion(updatedState);
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      setIsProcessing(false);
    }
  };
  
  const completeSurvey = async (state: ConversationState) => {
    setIsProcessing(true);
    try {
      const analysis = await intelligentSearch.generateFinalAnalysis(state, businessInfo);
      setFinalAnalysis(analysis);
      setIsComplete(true);
      
      // Call completion callback after a short delay
      setTimeout(() => {
        onComplete(analysis, state);
      }, 2000);
    } catch (error) {
      console.error('Error generating final analysis:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const progress = conversationState 
    ? Math.round((conversationState.questionsAsked.length / 10) * 100)
    : 0;
  
  if (!conversationState) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing intelligent search...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
                >
                  <Brain className="w-6 h-6 text-black" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold">Intelligent Search</h2>
                  <p className="text-sm text-white/80">Adaptive business discovery</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Question {conversationState.questionsAsked.length + 1} of 10</span>
                <span>{progress}% complete</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Confidence: {conversationState.confidenceScore}%</span>
                <span>Areas explored: {10 - conversationState.areasToExplore.length}/13</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isComplete && finalAnalysis ? (
            // Final Analysis View
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-black">Discovery Complete!</h3>
                  <p className="text-sm text-gray-600">Here's what we learned about your business</p>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {finalAnalysis}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Next Steps</p>
                    <p>I'll use these insights to provide you with personalized recommendations and match you with relevant investors.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // Question & Answer View
            <>
              {/* Previous Q&A History */}
              {conversationState.answersGiven.length > 0 && (
                <div className="mb-6 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Previous Answers</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {conversationState.answersGiven.slice(-2).map((qa, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-1">{qa.question}</div>
                        <div className="text-sm text-gray-800 line-clamp-2">{qa.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Current Question */}
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-xl p-4 border-2 border-black shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            currentQuestion.type === 'fixed' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {currentQuestion.type === 'fixed' ? 'Core Question' : 'Follow-up'}
                          </span>
                          {currentQuestion.reasoning && (
                            <span className="text-xs text-gray-500">{currentQuestion.reasoning}</span>
                          )}
                        </div>
                        <p className="text-base text-gray-900 font-medium leading-relaxed">
                          {currentQuestion.question}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer Input */}
                  <div className="space-y-3">
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleSubmitAnswer();
                        }
                      }}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-2 focus:ring-black/10 transition-colors resize-none text-gray-900 placeholder-gray-400"
                      rows={4}
                      disabled={isProcessing}
                    />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Tip: Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim() || isProcessing}
                        className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                          !userAnswer.trim() || isProcessing
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </span>
                        ) : (
                          'Next Question'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

