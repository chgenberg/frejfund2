'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Heart, X, Star, TrendingUp, DollarSign, Users,
  Calendar, Target, Sparkles, ChevronLeft, Eye
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BlindProfile {
  id: string; // Anonymous ID
  sessionId: string;
  industry: string;
  stage: string;
  oneLiner: string;
  askAmount: number;
  traction: {
    mrr?: string;
    users?: string;
    growth?: string;
    teamSize?: number;
  };
  matchScore: number;
  aiAnalysis: string;
  readinessScore: number;
  founded?: string;
  geography: string;
}

export default function VCSwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState<BlindProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [revealedCompany, setRevealedCompany] = useState<any>(null);

  useEffect(() => {
    ensurePreferencesThenLoad();
  }, []);

  const ensurePreferencesThenLoad = async () => {
    const vcEmail = localStorage.getItem('vc-email');
    
    if (!vcEmail) {
      // Redirect to login if no VC email
      window.location.href = '/vc';
      return;
    }

    // Require preferences
    try {
      const prefRes = await fetch('/api/vc/preferences', {
        headers: { 'x-vc-email': vcEmail }
      });
      if (prefRes.ok) {
        const data = await prefRes.json();
        if (!data.preferences) {
          window.location.href = '/vc/preferences';
          return;
        }
      }
    } catch {}

    await loadProfiles();
  };

  const loadProfiles = async () => {
    const vcEmail = localStorage.getItem('vc-email');

    try {
      const response = await fetch('/api/vc/swipe', {
        headers: {
          'x-vc-email': vcEmail
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }

    // Fallback to mock data if API fails
    const mockProfiles: BlindProfile[] = [
      {
        id: 'anon_1',
        sessionId: 'sess_xyz',
        industry: 'B2B SaaS',
        stage: 'Seed',
        oneLiner: 'Stripe for enterprise data workflows - automating complex integrations',
        askAmount: 2000000,
        traction: {
          mrr: '$87k',
          users: '342',
          growth: '+18% MoM',
          teamSize: 4
        },
        matchScore: 94,
        aiAnalysis: 'Strong unit economics with CAC of $450 and LTV of $5.4k. Team has proven track record (ex-Spotify, ex-Klarna). Product-market fit validated with 342 paying customers. Growth metrics above industry average for seed stage.',
        readinessScore: 75,
        founded: '6 months ago',
        geography: 'Stockholm, Sweden'
      },
      {
        id: 'anon_2',
        sessionId: 'sess_abc',
        industry: 'Health Tech',
        stage: 'Seed',
        oneLiner: 'AI-powered diagnostics for primary care - 10x faster than traditional methods',
        askAmount: 3000000,
        traction: {
          users: '1,200',
          growth: '+35% MoM',
          teamSize: 6
        },
        matchScore: 89,
        aiAnalysis: 'Exceptional growth rate. Team includes 2 MDs and 1 AI researcher from MIT. Early traction in regulated space impressive. Potential for category leadership.',
        readinessScore: 82,
        founded: '8 months ago',
        geography: 'Copenhagen, Denmark'
      },
      {
        id: 'anon_3',
        sessionId: 'sess_def',
        industry: 'Fintech',
        stage: 'Seed',
        oneLiner: 'Banking infrastructure for SMEs - embed financial services in 3 lines of code',
        askAmount: 2500000,
        traction: {
          mrr: '$42k',
          users: '89',
          growth: '+28% MoM',
          teamSize: 5
        },
        matchScore: 91,
        aiAnalysis: 'High-value customers ($470 ACV). Strong retention (98% after 6mo). Team built similar infrastructure at Klarna. Regulatory risk mitigated with banking partner.',
        readinessScore: 78,
        founded: '10 months ago',
        geography: 'Helsinki, Finland'
      }
    ];

    setProfiles(mockProfiles);
    setLoading(false);
  };

  const handleSwipe = (direction: 'left' | 'right', profile: BlindProfile) => {
    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'right') {
        // Like - trigger reveal
        handleLike(profile);
      } else {
        // Pass - move to next
        moveToNext();
      }
      setSwipeDirection(null);
    }, 300);
  };

  const handleLike = async (profile: BlindProfile) => {
    // Save swipe to database
    const vcEmail = localStorage.getItem('vc-email') || 'demo@vc.com';
    const vcFirm = localStorage.getItem('vc-firm') || 'Demo VC';

    try {
      const isDemoVc = (vcEmail || '').includes('demo@');
      if (isDemoVc) {
        // Simulate immediate intro request without backend
        setRevealedCompany({
          pending: true,
          message: `Intro request sent to the founder. You'll be notified when they respond.`,
          matchScore: profile.matchScore,
          status: 'pending',
          requestId: `demo-${Date.now()}`
        });
        setShowReveal(true);
      } else {
        const response = await fetch('/api/vc/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vcEmail,
            vcFirm,
            sessionId: profile.sessionId,
            action: 'like',
            anonymousData: profile
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.action === 'intro_requested') {
            setRevealedCompany({
              pending: true,
              message: data.message,
              matchScore: profile.matchScore,
              status: data.status,
              requestId: data.requestId
            });
            setShowReveal(true);
          } else if (data.action === 'revealed' && data.fullProfile) {
            setRevealedCompany({
              ...data.fullProfile,
              matchScore: profile.matchScore,
              aiAnalysis: profile.aiAnalysis
            });
            setShowReveal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }

    moveToNext();
  };

  const moveToNext = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">All caught up!</h2>
          <p className="text-gray-600 mb-6">
            No more matches for today. Check back tomorrow for new qualified leads.
          </p>
          <button
            onClick={() => window.location.href = '/vc'}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/vc'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="text-center">
            <div className="text-sm font-medium text-black">Deal Flow</div>
            <div className="text-xs text-gray-500">
              {currentIndex + 1} of {profiles.length}
            </div>
          </div>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Swipe Cards */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="relative h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ scale: 0.9, opacity: 0, rotateY: -10 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ 
                x: swipeDirection === 'right' ? 400 : swipeDirection === 'left' ? -400 : 0,
                opacity: 0,
                rotate: swipeDirection === 'right' ? 15 : swipeDirection === 'left' ? -15 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info: PanInfo) => {
                if (info.offset.x > 100) {
                  handleSwipe('right', currentProfile);
                } else if (info.offset.x < -100) {
                  handleSwipe('left', currentProfile);
                }
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl h-full overflow-y-auto">
                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="px-3 py-1.5 bg-black text-white rounded-full text-sm font-bold shadow-lg border-2 border-white"
                  >
                    {currentProfile.matchScore}% Match
                  </motion.div>
                </div>

                <div className="p-6 sm:p-8">
                  {/* Anonymous Header */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Anonymous Company</div>
                        <div className="text-2xl font-bold text-black">#{currentProfile.id.slice(-4).toUpperCase()}</div>
                      </div>
                    </div>
                    <p className="text-lg text-gray-800 leading-relaxed">
                      "{currentProfile.oneLiner}"
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Industry</div>
                      <div className="text-sm font-semibold text-black">{currentProfile.industry}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Stage</div>
                      <div className="text-sm font-semibold text-black">{currentProfile.stage}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Raising</div>
                      <div className="text-sm font-semibold text-black">
                        ${(currentProfile.askAmount / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Location</div>
                      <div className="text-sm font-semibold text-black">{currentProfile.geography}</div>
                    </div>
                  </div>

                  {/* Traction */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Traction</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {currentProfile.traction.mrr && (
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <DollarSign className="w-3 h-3 text-gray-500" />
                            <div className="text-xs text-gray-600">MRR</div>
                          </div>
                          <div className="text-xl font-bold text-black">{currentProfile.traction.mrr}</div>
                        </div>
                      )}
                      {currentProfile.traction.users && (
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Users className="w-3 h-3 text-gray-500" />
                            <div className="text-xs text-gray-600">Users</div>
                          </div>
                          <div className="text-xl font-bold text-black">{currentProfile.traction.users}</div>
                        </div>
                      )}
                      {currentProfile.traction.growth && (
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <div className="text-xs text-gray-600">Growth</div>
                          </div>
                          <div className="text-xl font-bold text-green-600">{currentProfile.traction.growth}</div>
                        </div>
                      )}
                      {currentProfile.traction.teamSize && (
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Users className="w-3 h-3 text-gray-500" />
                            <div className="text-xs text-gray-600">Team</div>
                          </div>
                          <div className="text-xl font-bold text-black">{currentProfile.traction.teamSize}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <motion.div
                    whileHover={{ 
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      scale: 1.01
                    }}
                    transition={{ duration: 0.2 }}
                    className="mb-6 p-4 bg-gray-100 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Sparkles className="w-4 h-4 text-black" />
                      </motion.div>
                      <h3 className="text-sm font-semibold text-black">AI Analysis</h3>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {currentProfile.aiAnalysis}
                    </p>
                  </motion.div>

                  {/* Readiness Score */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 bg-gray-900 border-2 border-gray-800 rounded-xl"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">Investment Readiness</div>
                      <div className="text-xs text-gray-400">Above average for {currentProfile.stage}</div>
                    </div>
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center bg-black"
                    >
                      <span className="text-xl font-bold text-white">{currentProfile.readinessScore}</span>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                  <div className="flex items-center justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.15, rotate: -10 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleSwipe('left', currentProfile)}
                      className="w-16 h-16 bg-white border-3 border-gray-300 rounded-full flex items-center justify-center hover:border-black hover:bg-gray-50 transition-all shadow-lg"
                    >
                      <motion.div
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <X className="w-7 h-7 text-gray-700" />
                      </motion.div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleSwipe('right', currentProfile)}
                      className="w-20 h-20 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-all shadow-2xl relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white opacity-0"
                        whileHover={{ opacity: 0.1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Heart className="w-8 h-8 text-white fill-current relative z-10" />
                      </motion.div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        // Super like
                        handleSwipe('right', currentProfile);
                      }}
                      className="w-16 h-16 bg-white border-3 border-gray-900 rounded-full flex items-center justify-center hover:bg-gray-900 transition-all shadow-lg group"
                    >
                      <motion.div
                        animate={{ 
                          rotate: [0, 20, -20, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Star className="w-6 h-6 text-gray-900 group-hover:text-white fill-current transition-colors" />
                      </motion.div>
                    </motion.button>
                  </div>
                  <div className="text-center mt-3 text-xs text-gray-500">
                    Swipe or tap: ❌ Pass • ❤️ Interested • ⭐ Super Like
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Reveal Modal */}
        <AnimatePresence>
          {showReveal && revealedCompany && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setShowReveal(false)}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  {/* Reveal Header */}
                  <div className="bg-black p-8 text-white text-center relative overflow-hidden">
                    {/* Animated background particles */}
                    <motion.div
                      className="absolute inset-0 opacity-10"
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                      }}
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 relative z-10"
                    >
                      <Heart className="w-10 h-10 text-black fill-current" />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2 relative z-10">It's a Match!</h2>
                    <p className="text-gray-300 relative z-10">You can now see full company details</p>
                  </div>

                  {/* Revealed Info */}
                  <div className="p-6">
                    {revealedCompany.pending ? (
                      /* Waiting State */
                      <div className="text-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-xl font-bold text-black mb-2">Intro Request Sent</h3>
                        <p className="text-gray-600 mb-4">
                          {revealedCompany.message || 'Waiting for founder to accept...'}
                        </p>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700">
                          We've notified the founder. You'll get an email when they respond (usually within 24 hours).
                        </div>
                        <button
                          onClick={() => setShowReveal(false)}
                          className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                          Continue Swiping
                        </button>
                      </div>
                    ) : (
                      /* Full Reveal */
                      <>
                        <div className="text-center mb-6">
                          <h3 className="text-3xl font-bold text-black mb-2">
                            {revealedCompany.company || 'Company Name'}
                          </h3>
                          <p className="text-gray-600">Founded by {revealedCompany.name || 'Founder Name'}</p>
                        </div>

                    <div className="space-y-4 mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">One-liner</div>
                        <div className="text-base text-gray-900">{currentProfile.oneLiner}</div>
                      </div>

                      {revealedCompany.website && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Website</div>
                          <a 
                            href={revealedCompany.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-black hover:underline inline-flex items-center space-x-1"
                          >
                            <span>{revealedCompany.website}</span>
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      {revealedCompany.email && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Contact</div>
                          <div className="text-base text-gray-900">{revealedCompany.email}</div>
                        </div>
                      )}
                    </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const mailto = `mailto:intros@frejfund.com?subject=Intro Request: ${revealedCompany.company}&body=I'd like an introduction to ${revealedCompany.name} at ${revealedCompany.company}.`;
                              window.location.href = mailto;
                            }}
                            className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                          >
                            Request Intro
                          </motion.button>
                          <button
                            onClick={() => setShowReveal(false)}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
