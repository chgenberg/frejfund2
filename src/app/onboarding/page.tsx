'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Calendar,
  Database,
  Users,
  Brain,
  Shield,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  AlertCircle,
  MessageCircle,
  BarChart3,
  FileText,
  Zap,
  Clock,
  Target,
  ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);

  const integrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      description: 'Email intelligence',
      benefits: [
        'Auto-analyze customer feedback',
        'Track investor communications',
        'Extract action items & deadlines',
      ],
      dataUsed: 'Email subjects, body text, and metadata (never attachments without permission)',
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: Calendar,
      description: 'Time optimization',
      benefits: ['Meeting prep & follow-ups', 'Time allocation insights', 'Deadline tracking'],
      dataUsed: 'Event titles, times, and attendees (no event details)',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: Database,
      description: 'Financial metrics',
      benefits: ['Real-time revenue tracking', 'Churn & growth alerts', 'Customer health scores'],
      dataUsed: 'Transaction amounts, customer IDs, subscription status',
    },
    {
      id: 'crm',
      name: 'HubSpot/Pipedrive',
      icon: Users,
      description: 'Sales intelligence',
      benefits: ['Pipeline velocity tracking', 'Deal risk identification', 'Relationship insights'],
      dataUsed: 'Contact names, deal stages, activity history',
    },
  ];

  const steps: Step[] = [
    {
      id: 0,
      title: 'Welcome to Freja',
      subtitle: 'Your AI co-founder that never sleeps',
      content: (
        <div className="space-y-3 sm:space-y-8 w-full">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-16 h-16 sm:w-32 sm:h-32 bg-black rounded-2xl sm:rounded-3xl flex items-center justify-center"
            >
              <Brain className="w-8 h-8 sm:w-16 sm:h-16 text-white" />
            </motion.div>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs sm:text-lg text-gray-700 leading-relaxed">
              Freja continuously monitors your business data to surface insights, identify risks,
              and recommend specific actions.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
            {[
              { icon: TrendingUp, label: 'Growth', desc: 'Spot opportunities before competitors' },
              { icon: AlertCircle, label: 'Risks', desc: 'Catch problems early' },
              { icon: MessageCircle, label: '24/7 Help', desc: 'Get answers instantly' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-lg p-2.5 sm:p-4 text-center"
              >
                <item.icon className="w-5 h-5 sm:w-8 sm:h-8 text-gray-700 mx-auto mb-1 sm:mb-2" />
                <h3 className="font-medium text-black text-[10px] sm:text-base">{item.label}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Connect Your Tools',
      subtitle: 'More data = better insights',
      content: (
        <div className="space-y-3 sm:space-y-6 w-full">
          <p className="text-center text-xs sm:text-base text-gray-700 max-w-2xl mx-auto">
            Select the tools you use.
          </p>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-4xl mx-auto">
            {integrations.map((integration) => (
              <motion.div
                key={integration.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedIntegrations((prev) =>
                    prev.includes(integration.id)
                      ? prev.filter((id) => id !== integration.id)
                      : [...prev, integration.id],
                  );
                }}
                className={`p-3 sm:p-6 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
                  selectedIntegrations.includes(integration.id)
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <integration.icon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black text-xs sm:text-base">
                        {integration.name}
                      </h3>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedIntegrations.includes(integration.id)
                        ? 'border-black bg-black'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedIntegrations.includes(integration.id) && (
                      <Check className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
                    )}
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
                  {integration.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'How Freja Uses Your Data',
      subtitle: 'Transparency first',
      content: (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="bg-gray-50 rounded-xl p-6 flex items-start space-x-4">
            <Shield className="w-8 h-8 text-gray-700 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-black mb-2">Your data stays yours</h3>
              <p className="text-gray-700">
                We never sell or share your data. Everything is encrypted end-to-end and you can
                delete it anytime.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-black">What we analyze:</h3>
            {selectedIntegrations.length > 0 ? (
              <div className="space-y-3">
                {integrations
                  .filter((int) => selectedIntegrations.includes(int.id))
                  .map((integration) => (
                    <div
                      key={integration.id}
                      className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <integration.icon className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium text-black">{integration.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{integration.dataUsed}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No integrations selected yet. Go back to select some!
              </p>
            )}
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="font-medium text-blue-900 mb-2">🔒 Privacy Promise</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• We only access what you explicitly connect</li>
              <li>• Your data trains your instance only, never shared models</li>
              <li>• Deletion is immediate and permanent</li>
              <li>• SOC 2 Type II certified infrastructure</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Your Daily Workflow',
      subtitle: 'How Freja fits into your day',
      content: (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="space-y-6">
            {[
              {
                time: '8:00 AM',
                icon: Clock,
                title: 'Morning Compass',
                desc: 'Start your day with 3 insights, 3 risks, and 3 actions based on overnight changes',
              },
              {
                time: 'Throughout the day',
                icon: Zap,
                title: 'Real-time alerts',
                desc: 'Get notified of important events: big deals, customer churn, urgent emails',
              },
              {
                time: 'Anytime',
                icon: MessageCircle,
                title: 'Strategic advisor',
                desc: 'Ask questions, get data-backed answers, brainstorm solutions',
              },
              {
                time: 'Weekly',
                icon: BarChart3,
                title: 'Progress review',
                desc: 'See your growth trajectory and get recommendations for the week ahead',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex space-x-4"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm text-gray-500">{item.time}</span>
                  </div>
                  <h3 className="font-medium text-black">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center">
            <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="font-medium text-black mb-2">Your success metrics</h3>
            <p className="text-sm text-gray-700">
              Founders using Freja report 3x faster decision-making and catching critical issues 5
              days earlier on average.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Ready to Get Started?',
      subtitle: 'Your AI co-founder awaits',
      content: (
        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-32 h-32 bg-black rounded-3xl flex items-center justify-center"
            >
              <Sparkles className="w-16 h-16 text-white" />
            </motion.div>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold text-black">
              Let's build something amazing together
            </h2>
            <p className="text-lg text-gray-700">
              I'll start analyzing your business immediately and have your first insights ready in
              minutes.
            </p>
          </div>

          {selectedIntegrations.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
              <h3 className="font-medium text-black mb-3">You're connecting:</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {integrations
                  .filter((int) => selectedIntegrations.includes(int.id))
                  .map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2"
                    >
                      <integration.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-800">{integration.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-black text-white rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5 sm:py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-black">FrejFund</h1>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 sm:h-2 transition-all duration-300 ${
                  index === currentStep
                    ? 'w-6 sm:w-8 bg-black rounded-full'
                    : index < currentStep
                      ? 'w-1.5 sm:w-2 bg-gray-400 rounded-full'
                      : 'w-1.5 sm:w-2 bg-gray-200 rounded-full'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors"
          >
            Skip
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col space-y-3 sm:space-y-6"
            >
              <div className="text-center flex-shrink-0">
                <h1 className="text-lg sm:text-3xl font-semibold text-black mb-0.5 sm:mb-2">
                  {steps[currentStep].title}
                </h1>
                <p className="text-xs sm:text-lg text-gray-600">{steps[currentStep].subtitle}</p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                {steps[currentStep].content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-2.5 sm:py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-1 sm:gap-2 ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-black hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-1 sm:gap-2 ${
              currentStep === steps.length - 1 ? 'hidden' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            Continue
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
