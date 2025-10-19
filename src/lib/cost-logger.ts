/**
 * Cost logger for OpenAI requests
 */

import { getModelPricing } from '@/lib/ai-client';

export type AICostLog = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  route?: string;
  sessionId?: string;
  meta?: Record<string, any>;
};

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = getModelPricing(model);
  // Pricing is per 1M tokens
  const inputCost = (pricing.input / 1_000_000) * promptTokens;
  const outputCost = (pricing.output / 1_000_000) * completionTokens;
  const total = inputCost + outputCost;
  return Math.round(total * 10000) / 10000; // 4 decimals
}

export function logAICost(log: AICostLog) {
  try {
    const line = {
      type: 'ai_cost',
      ts: new Date().toISOString(),
      ...log,
    };
    // Console structured log
    console.log(JSON.stringify(line));
  } catch (e) {
    console.error('[CostLogger] Failed to log cost:', e);
  }
}
