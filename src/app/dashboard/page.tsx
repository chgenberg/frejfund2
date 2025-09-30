'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Mail, Calendar, Database, Settings, ChevronRight, 
  TrendingUp, AlertCircle, CheckCircle2, Clock, BarChart3,
  MessageCircle, Brain, Users, FileText, Sparkles, X, Plus,
  Link2, Zap, Shield, Key, RefreshCw, Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  stats?: { label: string; value: string | number }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'integrations' | 'settings'>('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      status: 'disconnected',
      stats: [
        { label: 'Emails synced', value: '0' },
        { label: 'Last 30 days', value: '0' }
      ]
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: Calendar,
      status: 'disconnected',
      stats: [
        { label: 'Events tracked', value: '0' },
        { label: 'Meeting insights', value: '0' }
      ]
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: Database,
      status: 'disconnected',
      stats: [
        { label: 'MRR', value: '$0' },
        { label: 'Customers', value: '0' }
      ]
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      icon: Users,
      status: 'disconnected',
      stats: [
        { label: 'Contacts', value: '0' },
        { label: 'Deals in pipeline', value: '0' }
      ]
    }
  ]);

  const [metrics] = useState({
    investmentReadiness: 72,
    dailyActiveScore: 85,
    growthVelocity: 1.8,
    riskScore: 'Medium'
  });

  const [recentActivity] = useState([
    { time: '2 hours ago', text: 'Daily Compass generated', type: 'compass' },
    { time: '4 hours ago', text: '15 new emails analyzed', type: 'email' },
    { time: 'Yesterday', text: 'Pitch deck optimized', type: 'document' },
    { time: '2 days ago', text: 'Growth strategy updated', type: 'insight' }
  ]);

  const handleConnect = async (integrationId: string) => {
    // Simulated connection flow
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'connected', lastSync: new Date().toISOString() }
          : int
      )
    );
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === integrationId 
          ? { ...int, status: 'disconnected', lastSync: undefined }
          : int
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push('/')}
              >
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-black">FrejFund Dashboard</h1>
              </motion.div>
            </div>
            
            <nav className="flex items-center space-x-6">
              <button
                onClick={() => setActiveSection('overview')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'overview' ? 'text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveSection('integrations')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'integrations' ? 'text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                Integrations
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'settings' ? 'text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                Settings
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/chat')}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Open Chat
              </motion.button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.investmentReadiness}%</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Investment Readiness</h3>
                  <p className="text-xs text-gray-500 mt-1">+5% from last week</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Activity className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.dailyActiveScore}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Daily Active Score</h3>
                  <p className="text-xs text-gray-500 mt-1">Above average</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Zap className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.growthVelocity}x</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Growth Velocity</h3>
                  <p className="text-xs text-gray-500 mt-1">Month over month</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="text-2xl font-bold text-black">{metrics.riskScore}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Risk Level</h3>
                  <p className="text-xs text-gray-500 mt-1">2 items need attention</p>
                </motion.div>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-black mb-4">Recent Activity</h2>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            {activity.type === 'compass' && <Brain className="w-4 h-4 text-gray-600" />}
                            {activity.type === 'email' && <Mail className="w-4 h-4 text-gray-600" />}
                            {activity.type === 'document' && <FileText className="w-4 h-4 text-gray-600" />}
                            {activity.type === 'insight' && <TrendingUp className="w-4 h-4 text-gray-600" />}
                          </div>
                          <span className="text-sm text-gray-800">{activity.text}</span>
                        </div>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => router.push('/chat')}
                    >
                      <MessageCircle className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Chat with Freja</h3>
                      <p className="text-xs text-gray-500">Get instant advice</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <BarChart3 className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Run Analysis</h3>
                      <p className="text-xs text-gray-500">Full business review</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <FileText className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Update Pitch</h3>
                      <p className="text-xs text-gray-500">Optimize your deck</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => setActiveSection('integrations')}
                    >
                      <Link2 className="w-5 h-5 text-gray-700 mb-2" />
                      <h3 className="text-sm font-medium text-black">Add Integration</h3>
                      <p className="text-xs text-gray-500">Connect more data</p>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'integrations' && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-black">Integrations</h2>
                  <p className="text-gray-600 mt-1">Connect your tools to give Freja more context</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Integration
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <motion.div
                    key={integration.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <integration.icon className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-black">{integration.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${
                              integration.status === 'connected' ? 'bg-green-500' :
                              integration.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                            }`} />
                            <span className="text-xs text-gray-500">
                              {integration.status === 'connected' ? 'Connected' :
                               integration.status === 'error' ? 'Error' : 'Not connected'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {integration.status === 'connected' ? (
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleConnect(integration.id)}
                          className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          Connect
                        </motion.button>
                      )}
                    </div>

                    {integration.stats && (
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        {integration.stats.map((stat, index) => (
                          <div key={index}>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                            <p className="text-sm font-medium text-black">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {integration.lastSync && (
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>Last synced: {new Date(integration.lastSync).toLocaleDateString()}</span>
                        <button className="hover:text-black transition-colors inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Sync now
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-black mb-6">Settings</h2>
              
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Account</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Email</p>
                        <p className="text-sm text-gray-500">founder@company.com</p>
                      </div>
                      <button className="text-sm text-gray-600 hover:text-black transition-colors">Change</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Password</p>
                        <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                      </div>
                      <button className="text-sm text-gray-600 hover:text-black transition-colors">Update</button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Privacy & Security</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Two-factor authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-black rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Data encryption</p>
                        <p className="text-sm text-gray-500">End-to-end encryption enabled</p>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-medium text-black mb-4">Data Management</h3>
                  <div className="space-y-3">
                    <button className="text-sm text-gray-600 hover:text-black transition-colors inline-flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export all data
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-700 transition-colors block">
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
