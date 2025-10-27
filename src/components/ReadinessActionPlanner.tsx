'use client';

import React, { useState } from 'react';
import { ReadinessTreeData, ReadinessBranchData } from '@/types/business';

interface ReadinessActionPlannerProps {
  tree: ReadinessTreeData;
  sessionId: string;
}

/**
 * Interactive action planner for founders
 * Shows what to do next with concrete actions and progress tracking
 */
export const ReadinessActionPlanner: React.FC<ReadinessActionPlannerProps> = ({
  tree,
  sessionId,
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'timeline'>('overview');

  // Get branches sorted by completion (incomplete first)
  const prioritizedBranches = [...tree.branches].sort((a, b) => {
    if (a.completionPercent !== b.completionPercent) {
      return a.completionPercent - b.completionPercent;
    }
    return a.sequence - b.sequence;
  });

  const incompleteBranches = prioritizedBranches.filter(b => b.completionPercent < 100);
  const topPriority = incompleteBranches[0];

  const handleCheck = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const getMilestoneEmoji = (percent: number) => {
    if (percent >= 90) return '🎉';
    if (percent >= 70) return '🔨';
    if (percent >= 50) return '📈';
    if (percent >= 30) return '🌱';
    return '🚀';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Quick Win Banner */}
      {topPriority && topPriority.completionPercent < 70 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg">
          <h3 className="font-bold mb-2">⚡ Quick Win - Start Here!</h3>
          <p className="text-sm mb-3">
            Focus on <strong>{topPriority.displayName}</strong> - only at {topPriority.completionPercent}% done
          </p>
          <div className="space-y-2">
            {topPriority.items
              .filter(i => i.status === 'missing' || i.completionPercent < 50)
              .slice(0, 2)
              .map(item => (
                <div key={item.id} className="flex items-start gap-2 text-sm">
                  <span className="text-lg">→</span>
                  <div>
                    <strong>{item.displayName}</strong>
                    <p className="opacity-90">{item.guidancePrompt}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'detailed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 Detailed Checklist
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Timeline
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {tree.branches.map(branch => (
              <div
                key={branch.id}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg text-center hover:border-blue-400 transition-colors"
              >
                <div className="text-3xl mb-2">{getMilestoneEmoji(branch.completionPercent)}</div>
                <h4 className="font-semibold text-sm mb-1 line-clamp-2">{branch.displayName}</h4>

                {/* Progress Circle */}
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke={
                        branch.completionPercent >= 90
                          ? '#22c55e'
                          : branch.completionPercent >= 70
                          ? '#3b82f6'
                          : branch.completionPercent >= 50
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                      strokeWidth="4"
                      strokeDasharray={`${(branch.completionPercent / 100) * 220} 220`}
                      strokeLinecap="round"
                      className="transition-all"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-lg">{branch.completionPercent}%</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2">
                  {branch.items.filter(i => i.status === 'complete').length} of {branch.items.length} done
                </p>
              </div>
            ))}
          </div>

          {/* Big Picture */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
            <h3 className="font-bold text-lg mb-3">🎯 Your Path to Investor Ready</h3>

            <div className="space-y-2">
              {tree.branches.map((branch, idx) => (
                <div key={branch.id} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                      branch.completionPercent >= 90
                        ? 'bg-green-500'
                        : branch.completionPercent >= 70
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{branch.displayName}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${branch.completionPercent}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-600">{branch.completionPercent}%</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-500">
              <p className="text-sm">
                <strong>Estimated time to investor-ready:</strong> {tree.completionScore < 70 ? '4-6 weeks' : '1-2 weeks'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Checklist Tab */}
      {activeTab === 'detailed' && (
        <div className="space-y-6">
          {prioritizedBranches.map(branch => (
            <div key={branch.id} className="border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{branch.displayName}</h3>
                <span className="text-sm font-semibold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {branch.items.filter(i => i.status === 'complete').length}/{branch.items.length}
                </span>
              </div>

              <div className="space-y-3">
                {branch.items.map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checkedItems.has(item.id)}
                      onChange={() => handleCheck(item.id)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${checkedItems.has(item.id) ? 'line-through text-gray-500' : ''}`}>
                          {item.displayName}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            item.importance === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : item.importance === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.importance.charAt(0).toUpperCase() + item.importance.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.guidancePrompt}</p>
                      {item.exampleAnswer && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                            💡 See example
                          </summary>
                          <p className="mt-1 p-2 bg-blue-50 rounded italic">{item.exampleAnswer}</p>
                        </details>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm">
              <strong>Total Completion: {tree.completionScore}%</strong>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Estimated time to "investor ready": {tree.completionScore < 50 ? '4-6 weeks' : tree.completionScore < 70 ? '2-3 weeks' : '1 week'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold">📅 Recommended Timeline</h3>

            {/* Week 1 */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h4 className="font-semibold mb-3">Week 1: 🚀 Foundation</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Get your pitch deck started (target: 15 slides)</span>
                </li>
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Compile financial model template</span>
                </li>
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Create founder bios document</span>
                </li>
              </ul>
            </div>

            {/* Week 2-3 */}
            <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
              <h4 className="font-semibold mb-3">Week 2-3: 📊 Metrics & Evidence</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Finalize revenue & customer metrics</span>
                </li>
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Prepare cap table</span>
                </li>
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Draft GTM & roadmap</span>
                </li>
              </ul>
            </div>

            {/* Week 4+ */}
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <h4 className="font-semibold mb-3">Week 4+: ✨ Polish & Ready</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Review & iterate on all materials</span>
                </li>
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Get feedback from advisors</span>
                </li>
                <li className="flex gap-2">
                  <span>▪</span>
                  <span>Start pitcher practice & VC outreach</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg">
            <h3 className="font-bold mb-2">Ready to get started?</h3>
            <p className="mb-3 text-sm">Your next step: {topPriority ? `Work on ${topPriority.displayName}` : 'Complete your profile'}</p>
            <button className="bg-white text-blue-600 font-semibold px-6 py-2 rounded hover:bg-blue-50 transition-colors">
              Start Working on Next Task →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadinessActionPlanner;
