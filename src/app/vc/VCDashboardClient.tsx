'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, MapPin, TrendingUp, DollarSign, Users, 
  Calendar, Target, Building2, X, ChevronDown, Globe,
  BarChart3, List, Map as MapIcon, Activity, Briefcase,
  Clock, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues
const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
});

interface Startup {
  id: string;
  name: string;
  companyName: string;
  logo?: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  industry: string;
  stage: string;
  raised: number;
  seeking: number;
  monthlyRevenue: number;
  teamSize: number;
  foundedYear: number;
  readinessScore: number;
  oneLiner: string;
  metrics: {
    growth: number;
    retention: number;
    burnRate: number;
  };
  tags: string[];
  lastActive: Date;
}

export default function VCDashboardClient() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: 'all',
    stage: 'all',
    minRevenue: 0,
    maxRevenue: 1000000,
    minSeeking: 0,
    maxSeeking: 10000000,
    country: 'all',
    readinessScore: 0
  });

  useEffect(() => {
    setIsAuthenticated(true);
    loadStartups();
  }, []);

  const loadStartups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vc/startups');
      if (response.ok) {
        const data = await response.json();
        setStartups(data.startups);
      } else {
        setStartups([]);
      }
    } catch {
      setStartups([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStartups = startups.filter(startup => {
    if (searchQuery) {
      const query = String(searchQuery || '').toLowerCase();
      const company = String(startup.companyName || '').toLowerCase();
      const name = String(startup.name || '').toLowerCase();
      const industry = String(startup.industry || '').toLowerCase();
      const oneLiner = String(startup.oneLiner || '').toLowerCase();
      if (!company.includes(query) && !name.includes(query) && !industry.includes(query) && !oneLiner.includes(query)) {
        return false;
      }
    }
    if (filters.industry !== 'all' && startup.industry !== filters.industry) return false;
    if (filters.stage !== 'all' && startup.stage !== filters.stage) return false;
    const monthlyRevenue = Number(startup.monthlyRevenue || 0);
    const seeking = Number(startup.seeking || 0);
    const readiness = Number(startup.readinessScore || 0);
    const country = (startup.location && startup.location.country) ? startup.location.country : '';
    if (monthlyRevenue < filters.minRevenue || monthlyRevenue > filters.maxRevenue) return false;
    if (seeking < filters.minSeeking || seeking > filters.maxSeeking) return false;
    if (filters.country !== 'all' && country !== filters.country) return false;
    if (readiness < filters.readinessScore) return false;
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (typeof window === 'undefined') return null;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Investment Opportunities</h1>
                <p className="text-sm text-gray-600">{filteredStartups.length} companies match your criteria</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'} transition-all`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 rounded ${viewMode === 'map' ? 'bg-white text-black shadow-sm' : 'text-gray-600 hover:text-black'} transition-all`}>
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/vc/analytics')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Analytics
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by company, founder, industry..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {Object.values(filters).some(v => v !== 'all' && v !== 0 && v !== 1000000 && v !== 10000000) && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white border-b border-gray-200 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
                  <select value={filters.industry} onChange={(e) => setFilters({ ...filters, industry: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="all">All Industries</option>
                    <option value="B2B SaaS">B2B SaaS</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Health Tech">Health Tech</option>
                    <option value="Climate Tech">Climate Tech</option>
                    <option value="E-commerce">E-commerce</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
                  <select value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="all">All Stages</option>
                    <option value="Pre-seed">Pre-seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B">Series B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="all">All Countries</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Germany">Germany</option>
                    <option value="UK">United Kingdom</option>
                    <option value="France">France</option>
                    <option value="USA">United States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Revenue/mo</label>
                  <input type="number" value={filters.minRevenue} onChange={(e) => setFilters({ ...filters, minRevenue: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" placeholder="$0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Seeking</label>
                  <input type="number" value={filters.maxSeeking} onChange={(e) => setFilters({ ...filters, maxSeeking: parseInt(e.target.value) || 10000000 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" placeholder="$10M" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Readiness</label>
                  <input type="range" value={filters.readinessScore} onChange={(e) => setFilters({ ...filters, readinessScore: parseInt(e.target.value) })} min="0" max="100" className="w-full" />
                  <span className="text-xs text-gray-600">{filters.readinessScore}+</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading investment opportunities...</p>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-4">
              {filteredStartups.map((startup, index) => (
                <motion.div key={startup.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} onClick={() => router.push(`/vc/startup/${startup.id}`)} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {startup.logo ? (
                              <img src={startup.logo} alt={`${startup.companyName} logo`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-black">{startup.companyName}</h3>
                            <p className="text-gray-600 mt-1">{startup.oneLiner}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{startup.location.city}, {startup.location.country}</span>
                              <span className="flex items-center"><Users className="w-3 h-3 mr-1" />{startup.teamSize} team members</span>
                              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />Founded {startup.foundedYear}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center ml-6">
                          <div className={`text-3xl font-bold ${getScoreColor(startup.readinessScore)}`}>{startup.readinessScore}</div>
                          <p className="text-xs text-gray-600">Readiness</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Monthly Revenue</div>
                          <div className="text-lg font-bold text-black">${((Number(startup.monthlyRevenue || 0)) / 1000).toFixed(0)}k</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Growth</div>
                          <div className="text-lg font-bold text-green-600">+{Number(startup.metrics?.growth || 0)}%</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Seeking</div>
                          <div className="text-lg font-bold text-black">${((Number(startup.seeking || 0)) / 1000000).toFixed(1)}M</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Stage</div>
                          <div className="text-lg font-bold text-black">{startup.stage}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-black text-white rounded text-xs">{startup.industry}</span>
                          {startup.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center text-sm text-gray-500"><Clock className="w-3 h-3 mr-1" />Active today</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredStartups.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies match your criteria</h3>
                <p className="text-gray-600">Try adjusting your filters to see more results</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[calc(100vh-200px)]">
            <InteractiveMap startups={filteredStartups} onStartupClick={setSelectedStartup} />
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedStartup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedStartup(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-black">{selectedStartup.companyName}</h2>
                    <p className="text-gray-600 mt-1">{selectedStartup.oneLiner}</p>
                  </div>
                  <button onClick={() => setSelectedStartup(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-black mb-3">Key Metrics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-black">${(selectedStartup.monthlyRevenue / 1000).toFixed(0)}k</div><div className="text-sm text-gray-600">MRR</div></div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-green-600">+{selectedStartup.metrics.growth}%</div><div className="text-sm text-gray-600">Monthly Growth</div></div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-black">{selectedStartup.metrics.retention}%</div><div className="text-sm text-gray-600">Retention</div></div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push(`/vc/startup/${selectedStartup.id}`)} className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">View Full Analysis</motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 bg-white text-black border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">Request Introduction</motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



