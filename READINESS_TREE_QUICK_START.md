# 🌳 Readiness Tree - Quick Start Guide

## What's the Idea?

Instead of showing founders 68 analysis dimensions, we show them **5 clear branches**:

```
Your Company → Investor Ready?
  ├─ 📋 Documents (Pitch, financials, cap table...)
  ├─ 📊 Traction (Revenue, customers, retention...)
  ├─ 👥 Team (Founders, advisors, team size...)
  ├─ 🎯 Market (Problem, TAM, competition...)
  └─ 🚀 Execution (GTM, CAC, roadmap...)
```

Each branch gets:
- **Score** (0-100): How good is this aspect?
- **Completion %** (0-100): How much data filled in?
- **What's missing**: Exactly what to do next
- **Timeline**: How long to fix it

## The Code

### 1. Database Models (Prisma)
```prisma
model ReadinessTree {
  id String @id
  analysisId String @unique
  analysis DeepAnalysis @relation(...)
  branches ReadinessBranch[]
  totalScore Int?
  completionScore Int?
  overallReadiness String? // 'investor_ready' | 'needs_work' | 'early_stage' | 'incomplete'
}

model ReadinessBranch {
  id String @id
  treeId String
  branchType String // 'documents' | 'traction' | 'team' | 'market' | 'execution'
  displayName String // "📋 Documents & Materials"
  score Int?
  completionPercent Int
  items ReadinessItem[]
  recommendations String[]
}

model ReadinessItem {
  id String @id
  branchId String
  itemType String // 'pitch_deck', 'revenue', etc.
  displayName String
  status String // 'missing' | 'partial' | 'complete'
  score Int?
  guidancePrompt String?
  exampleAnswer String?
}
```

### 2. Tree Builder Engine
```typescript
// src/lib/readiness-tree-builder.ts

async function buildReadinessTree(sessionId: string): Promise<ReadinessTreeData> {
  // 1. Fetch 68 dimensions from deep analysis
  // 2. Map to 5 branches via DIMENSION_TO_BRANCH_MAPPING
  // 3. Calculate scores + completion %
  // 4. Generate recommendations
  // 5. Determine overall readiness status
}

function getBranchGuidance(branch): ReadinessGuidance {
  // Get actionable guidance for one branch
}

function summarizeReadinessTree(tree): Summary {
  // High-level overview for founder
}
```

### 3. API Endpoint
```typescript
// src/app/api/readiness-tree/route.ts

GET /api/readiness-tree?sessionId=xxx
  → Returns: { tree, summary }

POST /api/readiness-tree
  → Rebuild tree for a session
```

### 4. React Components
```tsx
// src/components/ReadinessTreeViewer.tsx
- Visualizes the 5 branches
- Shows progress bars
- Expandable details
- Guidance prompts

// src/components/ReadinessActionPlanner.tsx
- Overview of all branches
- Interactive checklist
- Week-by-week timeline
- "What to do next"
```

## How to Use

### 1. After Deep Analysis Completes
```typescript
// In deep-analysis-runner.ts
const tree = await buildReadinessTree(sessionId);
// Save via: POST /api/readiness-tree
```

### 2. Show to Founder
```tsx
// In dashboard page
import ReadinessTreeViewer from '@/components/ReadinessTreeViewer';
import ReadinessActionPlanner from '@/components/ReadinessActionPlanner';

const data = await fetch(`/api/readiness-tree?sessionId=${sessionId}`).then(r => r.json());

return (
  <>
    <ReadinessTreeViewer tree={data.tree} />
    <ReadinessActionPlanner tree={data.tree} sessionId={sessionId} />
  </>
);
```

### 3. In Freja Chat
```typescript
// When founder asks "what should I work on?"
const tree = await buildReadinessTree(sessionId);
const summary = summarizeReadinessTree(tree);

// Use in response
Freja: `
${summary.headline}
${summary.keyMessage}
Top 3 priorities:
${summary.topActions.map(a => `• ${a}`).join('\n')}
Estimated time: ${summary.estimatedTimeToReady}
`
```

## Files

### ✅ Created:
- `src/lib/readiness-tree-builder.ts` - Core engine
- `src/app/api/readiness-tree/route.ts` - API
- `src/components/ReadinessTreeViewer.tsx` - UI
- `src/components/ReadinessActionPlanner.tsx` - Checklist
- `docs/readiness-tree-implementation.md` - Full docs

### ✅ Modified:
- `prisma/schema.prisma` - Added 3 models
- `src/types/business.ts` - Added 5 interfaces

## Deploy

```bash
# 1. Create migration
npx prisma migrate dev --name add_readiness_tree

# 2. Push to production
npx prisma migrate deploy

# 3. Integrate into dashboard page
# (Add the components where analysis results are shown)
```

## Example Flow

```
Founder runs analysis
  ↓ (completes)
  ↓
Tree auto-builds (5 branches)
  ↓
Founder sees dashboard with visualization
  ├─ Documents: 85% ✅
  ├─ Traction: 42% ❌
  ├─ Team: 60% ⚠️
  ├─ Market: 71% ✅
  └─ Execution: 45% ❌
  ↓
Clicks "Traction" branch
  ↓
Sees detailed checklist:
  ✅ Revenue & MRR
  ✅ Customer Count
  ⚠️ Retention (50% done)
  ❌ Unit Economics (missing)
  ⚠️ Product Metrics (40% done)
  ↓
Asks Freja: "What should I do?"
  ↓
Freja responds: "Work on Unit Economics next - need LTV & CAC calculations"
  ↓
Founder works through systematically
  ↓
(Repeat over weeks)
  ↓
Score improves → "Investor Ready!" 🎉
```

## Key Benefits

✅ **Clear priorities** - What to work on first
✅ **Progress tracking** - See improvements over time
✅ **Concrete guidance** - "Do X next" with examples
✅ **Timeline** - "4-6 weeks to investor-ready"
✅ **Beautiful UX** - Color-coded, interactive
✅ **AI-ready** - Data for Freja coaching

---

For full documentation, see `docs/readiness-tree-implementation.md`
