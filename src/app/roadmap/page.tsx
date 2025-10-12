'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Circle, ChevronRight, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { UserRoadmap, calculateRoadmapProgress, getCurrentMilestone } from '@/lib/goal-system';

export const dynamic = 'force-dynamic';

export default function RoadmapPage() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<UserRoadmap | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  useEffect(() => {
    // Load roadmap from localStorage
    const stored = localStorage.getItem('frejfund-roadmap');
    if (!stored) {
      router.push('/');
      return;
    }

    const raw = JSON.parse(stored) as any;
    // Hydrate dates from JSON strings
    const hydrated: UserRoadmap = {
      ...raw,
      startDate: raw?.startDate ? new Date(raw.startDate) : new Date(),
      targetDate: raw?.targetDate ? new Date(raw.targetDate) : new Date(),
      milestones: Array.isArray(raw?.milestones)
        ? raw.milestones.map((m: any) => ({
            ...m,
            tasks: Array.isArray(m?.tasks)
              ? m.tasks.map((t: any) => ({
                  ...t,
                  dueDate: t?.dueDate ? new Date(t.dueDate) : undefined
                }))
              : []
          }))
        : []
    };
    setRoadmap(hydrated);

    // Auto-expand first incomplete milestone
    const current = getCurrentMilestone(rm);
    if (current) {
      setExpandedMilestone(current.id);
    }
  }, [router]);

  const handleStartCoaching = () => {
    router.push('/chat');
  };

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  const progress = calculateRoadmapProgress(roadmap);
  const targetMs = roadmap.targetDate instanceof Date ? roadmap.targetDate.getTime() : new Date(roadmap.targetDate as unknown as string).getTime();
  const weeksRemaining = Math.ceil((targetMs - Date.now()) / (7 * 24 * 60 * 60 * 1000));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">FrejFund</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-8 mb-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            🎉 Your Personalized Roadmap is Ready!
          </h2>
          <p className="text-gray-700 max-w-xl mx-auto">
            Here's your step-by-step plan to <span className="font-semibold">{roadmap.goalTitle.toLowerCase()}</span>
          </p>
        </motion.div>

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Overall Progress</h3>
            <span className="text-2xl font-bold text-black">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-gradient-to-r from-gray-700 to-black h-full rounded-full"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-black">{roadmap.milestones.length}</p>
              <p className="text-xs text-gray-600">Milestones</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{weeksRemaining}</p>
              <p className="text-xs text-gray-600">Weeks Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {roadmap.milestones.reduce((sum, m) => sum + m.tasks.length, 0)}
              </p>
              <p className="text-xs text-gray-600">Total Tasks</p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-4 mb-8">
          {roadmap.milestones.map((milestone, idx) => {
            const isExpanded = expandedMilestone === milestone.id;
            const completedTasks = milestone.tasks.filter(t => t.completed).length;
            const milestoneProgress = Math.round((completedTasks / milestone.tasks.length) * 100);

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden"
              >
                {/* Milestone Header */}
                <button
                  onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.completed
                        ? 'bg-green-100'
                        : completedTasks > 0
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : completedTasks > 0 ? (
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-black mb-1">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {milestone.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{milestone.timeframe}</span>
                        </span>
                        <span>•</span>
                        <span>{completedTasks}/{milestone.tasks.length} tasks completed</span>
                        <span>•</span>
                        <span className="font-medium">{milestoneProgress}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} />
                </button>

                {/* Tasks List */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="p-6 space-y-3">
                      {milestone.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200"
                        >
                          {/* Checkbox */}
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            task.completed
                              ? 'bg-black border-black'
                              : 'border-gray-300'
                          }`}>
                            {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>

                          {/* Task Content */}
                          <div className="flex-1">
                            <h4 className={`font-medium mb-1 ${
                              task.completed ? 'text-gray-400 line-through' : 'text-black'
                            }`}>
                              {task.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {task.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <motion.button
            onClick={handleStartCoaching}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-12 py-5 bg-black text-white rounded-full text-lg font-semibold hover:shadow-2xl transition-all"
          >
            <span className="flex items-center space-x-2">
              <span>Start Coaching with Freja</span>
              <Sparkles className="w-5 h-5" />
            </span>
          </motion.button>

          <p className="text-sm text-gray-500 mt-4">
            Let's get started on your first milestone
          </p>
        </motion.div>
      </div>
    </div>
  );
}
