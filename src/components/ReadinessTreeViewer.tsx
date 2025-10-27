'use client';

import React, { useState } from 'react';
import { ReadinessTreeData, ReadinessBranchData, ReadinessItemData } from '@/types/business';

interface ReadinessTreeViewerProps {
  tree: ReadinessTreeData;
  onBranchClick?: (branch: ReadinessBranchData) => void;
  isLoading?: boolean;
}

/**
 * Visualize the investor readiness tree
 * Shows 5 branches with progress bars and completion status
 */
export const ReadinessTreeViewer: React.FC<ReadinessTreeViewerProps> = ({
  tree,
  onBranchClick,
  isLoading = false,
}) => {
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'investor_ready':
        return 'from-green-500 to-emerald-600';
      case 'needs_work':
        return 'from-blue-500 to-cyan-600';
      case 'early_stage':
        return 'from-amber-500 to-orange-600';
      case 'incomplete':
        return 'from-slate-400 to-slate-600';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 90) return 'bg-green-500';
    if (percent >= 70) return 'bg-blue-500';
    if (percent >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className={`mb-8 p-6 rounded-lg bg-gradient-to-r ${getReadinessColor(tree.overallReadiness)} text-white`}>
        <h1 className="text-3xl font-bold mb-2">🌳 Investor Readiness Tree</h1>
        <p className="text-lg opacity-90 mb-4">
          Your structured path to becoming 100% investor-ready
        </p>

        {/* Overall Score */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white bg-opacity-20 p-4 rounded">
            <p className="text-sm opacity-75">Overall Score</p>
            <p className="text-2xl font-bold">{tree.totalScore}%</p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded">
            <p className="text-sm opacity-75">Completion</p>
            <p className="text-2xl font-bold">{tree.completionScore}%</p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded">
            <p className="text-sm opacity-75">Status</p>
            <p className="text-xl font-bold capitalize">
              {tree.overallReadiness.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Branches */}
      <div className="space-y-4">
        {tree.branches.map((branch) => (
          <div
            key={branch.id}
            className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
          >
            {/* Branch Header */}
            <button
              onClick={() => {
                setExpandedBranch(expandedBranch === branch.id ? null : branch.id);
                onBranchClick?.(branch);
              }}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex-1 text-left">
                <h2 className="text-xl font-semibold">{branch.displayName}</h2>
                <p className="text-sm text-gray-600 mt-1">{branch.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="flex-shrink-0 ml-4 min-w-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{branch.completionPercent}%</span>
                  {branch.score && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getScoreBadge(branch.score)}`}>
                      Score: {branch.score}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${getCompletionColor(branch.completionPercent)}`}
                    style={{ width: `${branch.completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Expand Icon */}
              <span className="ml-4 text-gray-400">
                {expandedBranch === branch.id ? '▼' : '▶'}
              </span>
            </button>

            {/* Branch Details */}
            {expandedBranch === branch.id && (
              <div className="bg-white p-6 border-t-2 border-gray-200">
                {/* Summary */}
                {branch.summary && (
                  <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                    <h3 className="font-semibold text-green-900 mb-1">✨ What's Going Well</h3>
                    <p className="text-green-800">{branch.summary}</p>
                  </div>
                )}

                {/* Gaps */}
                {branch.gaps && (
                  <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <h3 className="font-semibold text-amber-900 mb-1">⚠️ What's Missing</h3>
                    <p className="text-amber-800">{branch.gaps}</p>
                  </div>
                )}

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">📋 Requirements in this Branch</h3>
                  <div className="space-y-2">
                    {branch.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.displayName}</h4>
                            <p className="text-xs text-gray-600 mt-1">{item.guidancePrompt}</p>
                          </div>
                          <div className="flex-shrink-0 ml-2 text-right">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                item.status === 'complete'
                                  ? 'bg-green-100 text-green-800'
                                  : item.status === 'partial'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Item Progress */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-full rounded-full ${getCompletionColor(item.completionPercent)}`}
                              style={{ width: `${item.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 min-w-[30px] text-right">
                            {item.completionPercent}%
                          </span>
                        </div>

                        {/* Example */}
                        {item.exampleAnswer && (
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                              💡 Example
                            </summary>
                            <p className="mt-1 p-2 bg-blue-50 rounded italic text-gray-700">{item.exampleAnswer}</p>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {branch.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <h3 className="font-semibold text-blue-900 mb-2">🎯 Next Steps</h3>
                    <ul className="space-y-1">
                      {branch.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-blue-800 text-sm">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps Guidance */}
                {branch.nextSteps && (
                  <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <h3 className="font-semibold text-purple-900 mb-1">📍 Action Plan</h3>
                    <p className="text-purple-800 text-sm">{branch.nextSteps}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">📚 What is the Readiness Tree?</h3>
        <p className="text-sm text-gray-700 mb-3">
          The Readiness Tree breaks down everything an investor needs to know into 5 key branches:
        </p>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            <strong>📋 Documents:</strong> Pitch deck, financial model, cap table, due diligence docs
          </li>
          <li>
            <strong>📊 Traction:</strong> Revenue, customers, retention, unit economics
          </li>
          <li>
            <strong>👥 Team:</strong> Founder background, team size, advisors, culture
          </li>
          <li>
            <strong>🎯 Market:</strong> Problem clarity, TAM, competitive advantage, business model
          </li>
          <li>
            <strong>🚀 Execution:</strong> Go-to-market strategy, customer acquisition, roadmap, partnerships
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-3">
          When all 5 branches score 70%+ and are investor-ready, you can confidently pitch to VCs.
        </p>
      </div>
    </div>
  );
};

export default ReadinessTreeViewer;
