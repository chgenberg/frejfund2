# Investor Readiness Tree - Implementation Guide

## 🌳 Overview

The **Investor Readiness Tree** is a revolutionary way to guide founders toward "100% investor-ready status". Instead of showing 68 scattered analysis dimensions, we organize everything into a **hierarchical 5-branch tree** that makes it crystal clear what founders need to do next.

### The Problem We're Solving

- **Founders don't know what's missing** - Deep analysis shows 68 dimensions but no clear priority
- **No actionable roadmap** - They get scores but not concrete next steps
- **Unclear timing** - "How long will this take?" - unclear
- **Overwhelming complexity** - Too much information, no structure

### The Solution: Readiness Tree

```
Your Company (100% Investor Ready = ALL 5 branches at 70%+)
│
├── 📋 Documents & Materials (Pitch deck, financial model, cap table...)
├── 📊 Traction & Metrics (Revenue, customers, retention, unit economics)
├── 👥 Team & Experience (Founders, co-founders, advisors, team size)
├── 🎯 Market & Business Model (Problem clarity, TAM, competition, moat)
└── 🚀 Go-to-Market & Execution (GTM strategy, CAC, roadmap, partnerships)
```

Each branch shows:
- **Overall Score** (0-100) - Quality of that aspect
- **Completion %** (0-100) - How much data is filled in
- **Missing items** - Exactly what's not done
- **Next steps** - Concrete actions with examples
- **Timeline** - "2-4 weeks to get this branch investor-ready"

---

## 🏗️ Architecture

### 1. **Database Models** (`prisma/schema.prisma`)

Three new models store the tree structure:

```prisma
model ReadinessTree {
  id                String
  analysisId        String @unique
  analysis          DeepAnalysis @relation(fields: [analysisId])
  
  branches          ReadinessBranch[]
  totalScore        Int?          // 0-100 aggregate
  completionScore   Int?          // 0-100
  overallReadiness  String?       // 'investor_ready' | 'needs_work' | 'early_stage' | 'incomplete'
}

model ReadinessBranch {
  id                String
  treeId            String
  branchType        String        // 'documents', 'traction', 'team', 'market', 'execution'
  displayName       String        // "📋 Documents & Materials"
  
  score             Int?          // 0-100
  completionPercent Int           // 0-100
  items             ReadinessItem[]
  recommendations   String[]      // Next steps
}

model ReadinessItem {
  id              String
  branchId        String
  itemType        String        // 'pitch_deck', 'financial_model', etc.
  displayName     String
  
  status          String        // 'missing' | 'partial' | 'complete'
  score           Int?          // 0-100
  guidancePrompt  String?       // "What should founder do?"
  exampleAnswer   String?       // "Good example of this"
}
```

### 2. **TypeScript Types** (`src/types/business.ts`)

```typescript
export interface ReadinessItemData {
  itemType: string
  displayName: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  status: 'missing' | 'partial' | 'complete'
  completionPercent: number // 0-100
  score?: number
  guidancePrompt?: string
  exampleAnswer?: string
}

export interface ReadinessBranchData {
  branchType: string
  displayName: string
  completionPercent: number
  items: ReadinessItemData[]
  recommendations: string[] // What to do next
}

export interface ReadinessTreeData {
  branches: ReadinessBranchData[]
  totalScore?: number // 0-100
  completionScore: number // 0-100
  overallReadiness: 'investor_ready' | 'needs_work' | 'early_stage' | 'incomplete'
}
```

### 3. **Building Engine** (`src/lib/readiness-tree-builder.ts`)

The core logic that:

1. **Fetches deep analysis** (all 68 dimensions)
2. **Maps dimensions to branches** via `DIMENSION_TO_BRANCH_MAPPING`
3. **Calculates branch scores** (weighted average of related dimensions)
4. **Determines completion %** (how many analyzed dimensions in that branch)
5. **Generates recommendations** (what's missing, what needs improvement)
6. **Computes overall readiness** (investor_ready / needs_work / early_stage / incomplete)

**Key Functions:**

```typescript
buildReadinessTree(sessionId)        // Main function - builds full tree
getBranchGuidance(branch)            // Get actionable guidance for a branch
summarizeReadinessTree(tree)         // Get headline + next steps
```

### 4. **API Endpoint** (`src/app/api/readiness-tree/route.ts`)

```
GET  /api/readiness-tree?sessionId=xxx    → Returns tree + summary
POST /api/readiness-tree                  → Rebuild tree after updates
```

### 5. **React Components**

#### **ReadinessTreeViewer** (`src/components/ReadinessTreeViewer.tsx`)

Beautiful visualization showing:
- 5 branches with progress bars
- Color-coded completion status (red/amber/blue/green)
- Expandable details for each branch
- Items with guidance prompts + examples
- Summary of what's good/missing/next

#### **ReadinessActionPlanner** (`src/components/ReadinessActionPlanner.tsx`)

Interactive checklist with:
- **Overview tab**: Circle progress for each branch
- **Detailed Checklist**: All items with checkboxes
- **Timeline**: Week-by-week roadmap to investor-ready

---

## 🔌 Integration Points

### 1. **After Deep Analysis Completes**

In `deep-analysis-runner.ts`, after analysis is done:

```typescript
// After all 68 dimensions analyzed
const tree = await buildReadinessTree(sessionId);
// Save to DB (via API)
await fetch('/api/readiness-tree', {
  method: 'POST',
  body: JSON.stringify({ sessionId })
});
```

### 2. **In Dashboard/Analysis Results Page**

```tsx
import ReadinessTreeViewer from '@/components/ReadinessTreeViewer';
import ReadinessActionPlanner from '@/components/ReadinessActionPlanner';

// In your results page:
const tree = await fetch(`/api/readiness-tree?sessionId=${sessionId}`).then(r => r.json());

return (
  <>
    <ReadinessTreeViewer tree={tree.tree} />
    <ReadinessActionPlanner tree={tree.tree} sessionId={sessionId} />
  </>
);
```

### 3. **Freja Coaching Integration**

In chat responses, reference the tree:

```typescript
// When founder asks "what should I work on?"
const tree = await buildReadinessTree(sessionId);
const summary = summarizeReadinessTree(tree);

return `
${summary.headline}

${summary.keyMessage}

**Your top 3 priorities:**
${summary.topActions.map(a => `• ${a}`).join('\n')}

**Estimated timeline:** ${summary.estimatedTimeToReady}
`;
```

### 4. **Email/Report Generation**

Send founders a weekly email:

```typescript
const tree = await buildReadinessTree(sessionId);
const incompleteBranches = tree.branches.filter(b => b.completionPercent < 70);

// Email template
`Hi ${founder},

Your Readiness Score: ${tree.completionScore}%

📊 Focus on: ${incompleteBranches[0].displayName}
${incompleteBranches[0].recommendations[0]}

Check your progress: [link to readiness tree dashboard]
`;
```

---

## 📊 The 5 Branches Explained

### 1. **📋 Documents & Materials**

**What it is:** All the papers/decks/docs investors need

**Items:**
- Pitch Deck (critical)
- Financial Model (high)
- Cap Table (high)
- 1-Pager Summary (medium)
- Due Diligence Document (medium)

**What we're looking for:**
- Professional, complete deck
- Realistic 3-5 year projections
- Clear cap table post-funding
- Answers to common investor questions

**Timeline:** Week 1-2

---

### 2. **📊 Traction & Metrics**

**What it is:** Hard evidence of product-market fit

**Items:**
- Revenue & MRR (critical)
- Customer Count & Growth (critical)
- Retention & Churn (high)
- Unit Economics (high)
- Product Metrics (medium)

**What we're looking for:**
- Growing revenue/customers
- Healthy retention
- LTV/CAC ratio > 3
- Clear growth trajectory

**Timeline:** Week 2-3

---

### 3. **👥 Team & Experience**

**What it is:** Why should we trust YOU to execute?

**Items:**
- Founder Experience (critical)
- Co-founder Fit (high)
- Team Size & Hiring Plans (high)
- Advisors & Board (medium)
- Culture & Diversity (medium)

**What we're looking for:**
- Relevant background/wins
- Complementary co-founder
- Growing team
- Strong advisors

**Timeline:** Ongoing (improves over time)

---

### 4. **🎯 Market & Business Model**

**What it is:** Is the market big? Is your approach unique?

**Items:**
- Problem Clarity (critical)
- TAM/SAM/SOM (critical)
- Competitive Advantage (high)
- Business Model (high)
- Market Validation (medium)

**What we're looking for:**
- Clear $B+ opportunity
- Defensible moat
- Sustainable business model
- Customer evidence

**Timeline:** Week 1-2

---

### 5. **🚀 Go-to-Market & Execution**

**What it is:** How will you acquire customers at scale?

**Items:**
- GTM Strategy (critical)
- Customer Acquisition Proof (critical)
- 12-Month Roadmap (high)
- Partnerships (medium)
- Risk Mitigation (medium)

**What we're looking for:**
- Proven acquisition channels
- Repeatable CAC
- Clear product roadmap
- Partnerships accelerating growth

**Timeline:** Week 2-4

---

## 🚀 Usage Examples

### For Founders:

1. **Founder logs in → sees analysis results**
   - "Your score: 62% overall, 58% complete"
   - "You're in 'needs_work' stage"

2. **Clicks on tree → sees each branch**
   - Documents: 85% (good!)
   - Traction: 42% (needs work)
   - Team: 60% (partial)
   - Market: 71% (good)
   - Execution: 45% (needs work)

3. **Clicks on Traction branch → sees checklist**
   - ✅ Revenue & MRR (complete)
   - ✅ Customer Count (complete)
   - ⚠️ Retention & Churn (partial - 50%)
   - ❌ Unit Economics (missing)
   - ⚠️ Product Metrics (partial - 40%)

4. **Guidance appears:**
   - "💡 Unit Economics: Need your LTV & CAC calculations"
   - "📌 Example: LTV $8,500, CAC $1,200, Ratio 7:1"

5. **Timeline tab:**
   - Week 1: Foundation (documents, problem clarity)
   - Week 2-3: Metrics & evidence
   - Week 4: Polish & ready

### For Freja AI:

When founder asks: "What should I focus on?"

Freja responds:
```
You're at 62% overall - close but needs polish!

**Priority #1: Traction metrics** (only 42% done)
• Missing unit economics - I need your LTV & CAC calculations
• Retention metrics incomplete - what's your monthly churn?

**Quick wins** (already started, just finish):
• Retention data - you've got 50% done, just add 2 more months

**Timeline:** With 2-3 weeks focused effort, you could hit "investor ready"

Ready to work on unit economics? I can help you structure this...
```

---

## 🔄 Data Flow

```
Founder starts session
     ↓
Inputs business info + uploads docs
     ↓
Deep analysis runs (68 dimensions)
     ↓
API: POST /api/readiness-tree
     ↓
buildReadinessTree() maps 68 dims → 5 branches
     ↓
Calculates scores + completion % + recommendations
     ↓
Saves to DB (ReadinessTree, ReadinessBranch, ReadinessItem)
     ↓
Frontend fetches: GET /api/readiness-tree?sessionId=xxx
     ↓
ReadinessTreeViewer renders beautiful 5-branch tree
     ↓
Founder can interact:
  - Expand branches to see details
  - Check off completed items
  - See timeline
  - Chat with Freja for guidance
```

---

## 🎯 Key Benefits

1. **Clear prioritization** - Founder knows exactly what to work on first
2. **Measurable progress** - Branch scores + completion % show movement
3. **Concrete guidance** - "Do this next" with examples
4. **Realistic timeline** - "4-6 weeks to investor-ready"
5. **Better UX** - Visual tree is beautiful + intuitive
6. **Coachable moments** - Freja can guide from the tree data
7. **VC-friendly** - Can auto-generate investor profiles from tree data

---

## 📋 Implementation Checklist

- [x] Database schema (ReadinessTree, ReadinessBranch, ReadinessItem)
- [x] TypeScript types
- [x] Tree building engine (buildReadinessTree, getBranchGuidance, summarizeReadinessTree)
- [x] API endpoint (GET/POST /api/readiness-tree)
- [x] ReadinessTreeViewer component
- [x] ReadinessActionPlanner component
- [ ] Migrate database (run: `npx prisma migrate deploy`)
- [ ] Integrate into dashboard/results page
- [ ] Integrate into Freja chat
- [ ] Add weekly email with tree summary
- [ ] Analytics: track which branches founders focus on
- [ ] A/B test tree vs old analysis view

---

## 🔮 Future Enhancements

1. **AI-powered guidance** - Freja gives specific advice per branch
2. **Template library** - "Download our pitch deck template"
3. **Peer comparison** - "How do you compare to similar startups?"
4. **Investor focus** - "What do Series A investors care most about?"
5. **Integration sync** - Connect to Google Drive, pull deck auto-fill
6. **Progress tracking** - "You've improved 8% this month!"
7. **Batch operations** - "Help me get to 80% across all branches"

---

## ❓ FAQ

**Q: What if a founder skips a branch?**
A: Tree stays visible but that branch score stays low. Freja coaching should nudge them.

**Q: How often should the tree rebuild?**
A: After each deep analysis run. Could also rebuild nightly if data changes.

**Q: What if no analysis exists yet?**
A: API returns 404, suggest they run analysis first.

**Q: Can VCs see the tree?**
A: Eventually yes - auto-generate VC-facing profile from tree data. For now, internal only.

**Q: How are scores calculated?**
A: Each branch score = weighted average of related dimensions. Confidence = high/medium/low. Completion % = % of analyzed dimensions in that branch.
