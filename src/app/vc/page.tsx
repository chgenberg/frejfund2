'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Filter, Search, ExternalLink, Mail,
  Building2, DollarSign, Users, Sparkles, Star
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface FounderLead {
  id: string;
  name: string;
  company: string;
  industry: string;
  stage: string;
  oneLiner: string;
  askAmount: number;
  matchScore: number;
  traction?: any;
  profileUrl: string;
  readinessScore: number;
}

export default function VCDashboard() {
  const [leads, setLeads] = useState<FounderLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [vcEmail, setVcEmail] = useState('');
  const [vcFirm, setVcFirm] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filterStage, setFilterStage] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');

  const handleLogin = () => {
    if (vcEmail && vcFirm) {
      localStorage.setItem('vc-email', vcEmail);
      localStorage.setItem('vc-firm', vcFirm);
      setIsAuthenticated(true);
      loadLeads();
    }
  };

  useEffect(() => {
    // Check if already logged in
    const savedEmail = localStorage.getItem('vc-email');
    const savedFirm = localStorage.getItem('vc-firm');
    
    if (savedEmail && savedFirm) {
      setVcEmail(savedEmail);
      setVcFirm(savedFirm);
      setIsAuthenticated(true);
      loadLeads();
    }
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    
    // Mock leads for demo
    const mockLeads: FounderLead[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        company: 'DataFlow',
        industry: 'B2B SaaS',
        stage: 'Seed',
        oneLiner: 'Stripe for enterprise data workflows - making complex integrations simple',
        askAmount: 2000000,
        matchScore: 94,
        traction: { mrr: '$87k', users: '342', growth: '+18% MoM' },
        profileUrl: '/founder/dataflow',
        readinessScore: 75
      },
      {
        id: '2',
        name: 'Erik Andersson',
        company: 'HealthAI',
        industry: 'Health Tech',
        stage: 'Seed',
        oneLiner: 'AI-powered diagnostics for primary care - 10x faster than traditional methods',
        askAmount: 3000000,
        matchScore: 89,
        traction: { users: '1.2k', growth: '+35% MoM' },
        profileUrl: '/founder/healthai',
        readinessScore: 82
      }
    ];
    
    setLeads(mockLeads);
    setLoading(false);
  };

  const filteredLeads = leads.filter(lead => {
    if (filterStage !== 'all' && lead.stage !== filterStage) return false;
    if (filterIndustry !== 'all' && !lead.industry.includes(filterIndustry)) return false;
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">FrejFund for VCs</h1>
            <p className="text-gray-600">Access AI-matched, qualified deal flow</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={vcEmail}
                onChange={(e) => setVcEmail(e.target.value)}
                placeholder="partner@vc-firm.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firm Name
              </label>
              <input
                type="text"
                value={vcFirm}
                onChange={(e) => setVcFirm(e.target.value)}
                placeholder="Creandum"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={!vcEmail || !vcFirm}
              className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Deal Flow
            </motion.button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            For VC access, contact{' '}
            <a href="mailto:vcs@frejfund.com" className="text-black font-medium hover:underline">
              vcs@frejfund.com
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-black">FrejFund for VCs</h1>
                <p className="text-sm text-gray-600">{vcFirm}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right mr-4">
                <div className="text-sm font-medium text-black">{filteredLeads.length} Matches</div>
                <div className="text-xs text-gray-500">Updated daily</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/vc/analytics'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/vc/swipe'}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Swiping</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center space-x-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Stages</option>
            <option value="Pre-seed">Pre-seed</option>
            <option value="Seed">Seed</option>
            <option value="Series A">Series A</option>
          </select>
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Industries</option>
            <option value="SaaS">SaaS</option>
            <option value="Fintech">Fintech</option>
            <option value="Health">Health Tech</option>
            <option value="Marketplace">Marketplace</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading qualified leads...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-bold text-black">{lead.company}</h2>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {lead.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{lead.oneLiner}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          {lead.stage}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          {lead.industry}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Raising ${(lead.askAmount / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                    <div className="text-center ml-4">
                      <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center">
                        <span className="text-xl font-bold text-black">{lead.readinessScore}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Ready</p>
                    </div>
                  </div>

                  {/* Traction */}
                  {lead.traction && (
                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
                      {lead.traction.mrr && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">MRR</div>
                          <div className="text-lg font-bold text-black">{lead.traction.mrr}</div>
                        </div>
                      )}
                      {lead.traction.users && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Users</div>
                          <div className="text-lg font-bold text-black">{lead.traction.users}</div>
                        </div>
                      )}
                      {lead.traction.growth && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Growth</div>
                          <div className="text-lg font-bold text-green-600">{lead.traction.growth}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Founder */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Founder</div>
                      <div className="text-sm font-medium text-black">{lead.name}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <a
                        href={lead.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Profile</span>
                      </a>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const mailto = `mailto:intros@frejfund.com?subject=Intro Request: ${lead.company}&body=I'd like an introduction to ${lead.name} at ${lead.company}.%0A%0AMy name: ${vcEmail}%0AMy firm: ${vcFirm}`;
                          window.location.href = mailto;
                        }}
                        className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Request Intro</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredLeads.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matches yet</h3>
                <p className="text-gray-600">Check back soon for new qualified leads</p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white">
          <h3 className="text-xl font-semibold mb-2">Want access to more qualified leads?</h3>
          <p className="text-gray-300 mb-6">
            FrejFund pre-screens and AI-matches founders to your investment thesis. 
            Get 10-20 qualified intros per month.
          </p>
          <div className="flex items-center space-x-4">
            <a
              href="mailto:vcs@frejfund.com?subject=VC Partnership Inquiry"
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Sales</span>
            </a>
            <span className="text-sm text-gray-400">Starting at $2k/month</span>
          </div>
        </div>
      </main>
    </div>
  );
}
