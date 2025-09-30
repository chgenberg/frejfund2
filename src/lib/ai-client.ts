import OpenAI from 'openai';

let DEV_SECRETS_LOCAL: unknown = null;
if (process.env.NODE_ENV === 'development') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./local-secrets');
    DEV_SECRETS_LOCAL = (mod && mod.DEV_SECRETS) ? mod.DEV_SECRETS : null;
  } catch {}
}

function isAzureConfigured(): boolean {
  return Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT);
}

export function getChatModel(): string {
  return (
    (process.env.NODE_ENV === 'development' && (DEV_SECRETS_LOCAL as any)?.openai?.chatModel) ||
    process.env.OPENAI_CHAT_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini'
  );
}

export function getEmbeddingsModel(): string {
  return (
    (process.env.NODE_ENV === 'development' && (DEV_SECRETS_LOCAL as any)?.openai?.embeddingsModel) ||
    process.env.OPENAI_EMBEDDINGS_MODEL ||
    'text-embedding-3-small'
  );
}

export function getModelPricePerMTok(model: string): { input: number; output: number } {
  // USD per 1M tokens (rough estimates, override via env if needed)
  const fallback = {
    input: Number(process.env.MODEL_PRICE_INPUT_PER_MTOK || 3),
    output: Number(process.env.MODEL_PRICE_OUTPUT_PER_MTOK || 15)
  };
  const table: Record<string, { input: number; output: number }> = {
    'gpt-5': { input: 5, output: 15 },
    'gpt-5-mini': { input: 1, output: 3 },
    'gpt-4o': { input: 5, output: 15 },
    'gpt-4o-mini': { input: 0.5, output: 1.5 }
  };
  return table[model] || fallback;
}

function resolveOpenAIKey(): string | undefined {
  const raw = (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI_TOKEN || '').trim();
  return raw || undefined;
}

export function getOpenAIClient(): OpenAI {
  const dev = process.env.NODE_ENV === 'development' ? (DEV_SECRETS_LOCAL as any)?.openai : null;
  if (isAzureConfigured()) {
    const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || getChatModel();
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';
    const apiKey = process.env.AZURE_OPENAI_API_KEY || '';

    return new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${deployment}`,
      defaultHeaders: { 'api-key': apiKey },
      defaultQuery: { 'api-version': apiVersion }
    });
  }

  // Standard OpenAI or OpenAI-compatible (e.g., proxy) configuration
  return new OpenAI({
    apiKey: dev?.apiKey || resolveOpenAIKey(),
    baseURL: dev?.baseURL || process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE,
    organization: process.env.OPENAI_ORG,
    project: dev?.project || process.env.OPENAI_PROJECT
  });
}

/**
 * Model selection based on task complexity
 */
export type TaskComplexity = 'simple' | 'complex';

export function getChatModel(complexity: TaskComplexity = 'simple'): string {
  // For simple chat interactions, use mini
  // For complex analysis, use full model
  const simpleModel = process.env.OPENAI_CHAT_MODEL_MINI || 'gpt-5-mini';
  const complexModel = process.env.OPENAI_CHAT_MODEL || 'gpt-5';
  
  return complexity === 'simple' ? simpleModel : complexModel;
}

export function getEmbeddingsModel(): string {
  return process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small';
}

/**
 * Pricing per model (per 1M tokens)
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5': { input: 2.5, output: 10.0 },
  'gpt-5-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'text-embedding-3-small': { input: 0.02, output: 0.02 },
  'text-embedding-3-large': { input: 0.13, output: 0.13 },
};

export function getModelPricing(model: string) {
  return MODEL_PRICING[model] || { input: 0, output: 0 };
}


