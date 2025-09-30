import OpenAI from 'openai';

let DEV_SECRETS_LOCAL: any = null;
try {
  // @ts-ignore
  DEV_SECRETS_LOCAL = require('./local-secrets').DEV_SECRETS;
} catch {}

function isAzureConfigured(): boolean {
  return Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT);
}

export function getChatModel(): string {
  return (
    (process.env.NODE_ENV === 'development' && DEV_SECRETS_LOCAL?.openai?.chatModel) ||
    process.env.OPENAI_CHAT_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini'
  );
}

export function getEmbeddingsModel(): string {
  return (
    (process.env.NODE_ENV === 'development' && DEV_SECRETS_LOCAL?.openai?.embeddingsModel) ||
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

export function getOpenAIClient(): OpenAI {
  const dev = process.env.NODE_ENV === 'development' ? DEV_SECRETS_LOCAL?.openai : null;
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
    apiKey: dev?.apiKey || process.env.OPENAI_API_KEY,
    baseURL: dev?.baseURL || process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE,
    organization: process.env.OPENAI_ORG,
    project: dev?.project || process.env.OPENAI_PROJECT
  });
}


