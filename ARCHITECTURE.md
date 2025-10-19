# FrejFund – Architecture Overview

## Tech Stack

- Next.js App Router (web + API routes)
- TypeScript
- Prisma + PostgreSQL
- BullMQ + Redis (background jobs, progress pub/sub)
- OpenAI (gpt-5 / gpt-5-mini)

## Runtime Processes

- Web (Next.js): UI + API (SSE progress, chat, analysis orchestration)
- Worker (BullMQ): runs deep‑analysis jobs, publishes progress via Redis

## Key Modules

- `src/app/api/deep-analysis/route.ts` – orchestration (POST start, GET results)
- `src/app/api/deep-analysis/progress/route.ts` – SSE progress stream (Redis + DB fallback)
- `src/lib/deep-analysis-runner.ts` – runs dimensions, saves to DB, emits progress callbacks
- `src/lib/enhanced-scraper.ts` – platform‑aware scraping (Shopify, WooCommerce, Squarespace, generic)
- `src/lib/web-scraper.ts` – UA + robots.txt friendly fetch + Readability/Cheerio extraction
- `src/lib/queues/deep-analysis.ts` – BullMQ queue/worker with retries/backoff
- `src/lib/ai-client.ts` – model selection (simple vs complex)
- `src/lib/openai.ts` – chat with fallback + cost logging
- `src/lib/cost-logger.ts` – token/cost estimation logs
- `src/lib/subscription-utils.ts` – tier/feature gating (Pro forced for testing)
- `src/lib/stripe-utils.ts` – optional Stripe (gracefully disabled if no env)

## Data Model (Prisma)

- `DeepAnalysis` – session‑scoped analysis, status/progress/score
- `AnalysisDimension` – per‑dimension results (score/findings/evidence/confidence)
- `Subscription` / `User` – tier + Stripe metadata (optional)

## Progress Semantics

- Worker updates DB progress and publishes Redis events
- SSE computes effective progress = `max(DB.progress, analyzedCount/total)` for robustness

## Environments

Required:

- `DATABASE_URL`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`
  Optional:
- `REDIS_URL`, Stripe keys, `SCRAPER_USER_AGENT`, soft‑quota flags (`SOFT_QUOTA_ENABLED`, `ANALYSIS_DAILY_LIMIT`)

## Local Development

- Node 22 (`.nvmrc`)
- `npm run dev` (web)
- `npm run worker` (BullMQ worker; needs `REDIS_URL`)

## CI

- GitHub Actions: Node 22, env verify, Next build

## Notes

- Stripe is optional and disabled if env keys are missing
- During testing: Pro tier forced, quotas optional
