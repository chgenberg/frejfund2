'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Calendar, Database, Users, FileText, Sparkles, 
  Check, X, Plus, ChevronRight, Shield, RefreshCw,
  Link2, Zap, Clock, TrendingUp, AlertCircle, Settings,
  CreditCard, BarChart3, MessageSquare, Building2
} from 'lucide-react';
import { generateOAuthUrl } from '@/lib/oauth-config';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'communication' | 'crm' | 'analytics' | 'payments' | 'productivity';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  color: string;
  features: string[];
  scopes?: string[];
  lastSync?: string;
  stats?: { label: string; value: string | number }[];
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Sync emails for AI analysis and insights',
      icon: Mail,
      category: 'communication',
      status: 'disconnected',
      color: 'red',
      features: ['Email sync', 'Attachment analysis', 'Thread tracking', 'Smart labeling'],
      scopes: ['gmail.readonly', 'gmail.metadata'],
      stats: [
        { label: 'Emails synced', value: '0' },
        { label: 'Insights generated', value: '0' }
      ]
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Track meetings and time allocation',
      icon: Calendar,
      category: 'productivity',
      status: 'disconnected',
      color: 'blue',
      features: ['Meeting analysis', 'Time tracking', 'Attendee insights', 'Scheduling optimization'],
      scopes: ['calendar.readonly', 'calendar.events.readonly']
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Revenue, MRR, and payment analytics',
      icon: CreditCard,
      category: 'payments',
      status: 'disconnected',
      color: 'purple',
      features: ['Revenue tracking', 'MRR analysis', 'Churn detection', 'Customer LTV'],
      stats: [
        { label: 'MRR', value: '$0' },
        { label: 'Active customers', value: '0' }
      ]
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM data and sales pipeline tracking',
      icon: Users,
      category: 'crm',
      status: 'disconnected',
      color: 'orange',
      features: ['Contact sync', 'Deal tracking', 'Pipeline analytics', 'Activity monitoring'],
      scopes: ['contacts', 'deals', 'timeline']
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication insights',
      icon: MessageSquare,
      category: 'communication',
      status: 'disconnected',
      color: 'purple',
      features: ['Channel analysis', 'Team sentiment', 'Key discussions', 'Decision tracking'],
      scopes: ['channels:history', 'channels:read']
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Website traffic and user behavior',
      icon: BarChart3,
      category: 'analytics',
      status: 'disconnected',
      color: 'orange',
      features: ['Traffic analysis', 'Conversion tracking', 'User journeys', 'Goal monitoring'],
      scopes: ['analytics.readonly']
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Sales CRM and deal management',
      icon: Building2,
      category: 'crm',
      status: 'disconnected',
      color: 'green',
      features: ['Deal flow', 'Sales velocity', 'Rep performance', 'Win rate analysis']
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Financial data and accounting',
      icon: Database,
      category: 'payments',
      status: 'disconnected',
      color: 'green',
      features: ['P&L tracking', 'Cash flow', 'Expense analysis', 'Financial health']
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrations.length },
    { id: 'communication', name: 'Communication', count: integrations.filter(i => i.category === 'communication').length },
    { id: 'crm', name: 'CRM', count: integrations.filter(i => i.category === 'crm').length },
    { id: 'analytics', name: 'Analytics', count: integrations.filter(i => i.category === 'analytics').length },
    { id: 'payments', name: 'Payments', count: integrations.filter(i => i.category === 'payments').length },
    { id: 'productivity', name: 'Productivity', count: integrations.filter(i => i.category === 'productivity').length }
  ];

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  const handleConnect = async (integration: Integration) => {
    setConnectingId(integration.id);
    
    // Simulate OAuth flow
    setTimeout(() => {
      // In production, this would:
      // 1. Generate OAuth URL with proper scopes
      // 2. Open OAuth popup/redirect
      // 3. Handle callback with auth code
      // 4. Exchange for access token
      // 5. Store encrypted token
      
      const oauthUrl = generateOAuthUrl(integration.id);
      
      if (oauthUrl) {
        // In production, open OAuth in popup or redirect
        console.log('Opening OAuth URL:', oauthUrl);
        
        // For now, simulate the flow
        // window.open(oauthUrl, 'oauth', 'width=600,height=700');
        
        // For demo, just simulate connection
        setIntegrations(prev => 
          prev.map(int => 
            int.id === integration.id 
              ? { ...int, status: 'connected', lastSync: new Date().toISOString() }
              : int
          )
        );
      } else {
        console.error('No OAuth config for:', integration.id);
      }
      
      setConnectingId(null);
    }, 2000);
  };

  const handleDisconnect = (integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      setIntegrations(prev => 
        prev.map(int => 
          int.id === integrationId 
            ? { ...int, status: 'disconnected', lastSync: undefined }
            : int
        )
      );
    }
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
                onClick={() => router.push('/dashboard')}
              >
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-black">Integrations</h1>
              </motion.div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Link2 className="w-4 h-4" />
                <span>{connectedCount} connected</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Back to Dashboard
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 hover:text-black border border-gray-200'
              }`}
            >
              {category.name}
              <span className="ml-2 text-xs opacity-70">({category.count})</span>
            </motion.button>
          ))}
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredIntegrations.map((integration) => (
              <motion.div
                key={integration.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center`}>
                        <integration.icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-black">{integration.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            integration.status === 'connected' ? 'bg-green-500' :
                            integration.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                            integration.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-500">
                            {integration.status === 'connected' ? 'Connected' :
                             integration.status === 'connecting' ? 'Connecting...' :
                             integration.status === 'error' ? 'Error' : 'Not connected'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {integration.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                        {feature}
                      </span>
                    ))}
                    {integration.features.length > 3 && (
                      <span className="text-xs text-gray-500">+{integration.features.length - 3} more</span>
                    )}
                  </div>

                  {/* Stats */}
                  {integration.stats && integration.status === 'connected' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {integration.stats.map((stat, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">{stat.label}</p>
                          <p className="text-sm font-medium text-black">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    {integration.status === 'connected' ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Disconnect
                        </button>
                        <button className="text-sm text-gray-600 hover:text-black transition-colors inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Sync now
                        </button>
                      </>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnect(integration)}
                        disabled={connectingId === integration.id}
                        className="w-full px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        {connectingId === integration.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Connect
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>

                  {/* Last Sync */}
                  {integration.lastSync && (
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      Last synced: {new Date(integration.lastSync).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Security Badge */}
                <div className="px-6 py-3 bg-gray-50 flex items-center justify-center space-x-2 text-xs text-gray-600">
                  <Shield className="w-3 h-3" />
                  <span>OAuth 2.0 secured</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Coming Soon */}
        <div className="mt-12 bg-gray-100 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-black mb-4">More integrations coming soon</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're constantly adding new integrations. Let us know which tools you'd like to connect.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Salesforce', 'Intercom', 'Mixpanel', 'Segment', 'Zendesk', 'Notion', 'Linear', 'GitHub'].map((name) => (
              <span key={name} className="px-4 py-2 bg-white rounded-lg text-sm text-gray-600 border border-gray-200">
                {name}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
