# 🚀 DEPLOYMENT GUIDE - Steg för Steg

## FÖRUTSÄTTNINGAR
- ✅ Node.js 18+ installerad
- ✅ PostgreSQL databas uppsatt
- ✅ `.env` fil konfigurerad
- ✅ Prisma redan i projektet

---

## PHASE 1: DATABASE MIGRATION (10 minuter)

### Steg 1.1: Kör Prisma Migration

```bash
cd /Users/christophergenberg/Desktop/frejfund-2.0

# Skapa och kör migration
npx prisma migrate dev --name add_readiness_tree

# Output ska visa:
# "✓ Prisma Migrate applied the following migration(s):
#  add_readiness_tree"
```

**Vad händer:** 3 nya tabeller skapas:
- `readiness_trees` - huvudmodell
- `readiness_branches` - de 5 grenarna
- `readiness_items` - individuella items

### Steg 1.2: Verifiera Migration

```bash
# Kontrollera att tabellerna finns
npx prisma db execute --stdin

# Kör denna SQL:
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'readiness_%';

# Output ska visa 3 rader:
# readiness_trees
# readiness_branches  
# readiness_items
```

✅ **Steg 1 Complete!** Databasen är klar.

---

## PHASE 2: VERIFY EXISTING CODE (5 minuter)

### Steg 2.1: Verifiera Deep Analysis Framework

```bash
# Kontrollera att deep-analysis-framework finns
ls -la src/lib/deep-analysis-framework.ts

# Output ska visa filen finns
```

### Steg 2.2: Verifiera Readiness Tree Builder

```bash
# Kontrollera att readiness-tree-builder finns
ls -la src/lib/readiness-tree-builder.ts

# Om den inte finns, den blev skapad redan i förra steget
```

### Steg 2.3: Verifiera API Endpoint

```bash
# Kontrollera att API finns
ls -la src/app/api/readiness-tree/route.ts

# Output ska visa filen finns
```

✅ **Steg 2 Complete!** All kod är på plats.

---

## PHASE 3: COMPILE & TEST (10 minuter)

### Steg 3.1: Type Check

```bash
cd /Users/christophergenberg/Desktop/frejfund-2.0

# Kör TypeScript compiler för att hitta errors
npx tsc --noEmit

# Om det finns errors, fixa dem nu
# Om ingen output = allt OK ✅
```

### Steg 3.2: Build Check

```bash
# Build Next.js projektet
npm run build

# Output ska visa:
# ✓ Ready in 30s
# ✓ Built successfully

# Om det finns errors, läs felmeddelandet noggrant
```

✅ **Steg 3 Complete!** Koden kompilerar utan errors.

---

## PHASE 4: API TEST (10 minuter)

### Steg 4.1: Starta Dev Server

```bash
# Terminal 1: Starta Next.js dev server
npm run dev

# Output ska visa:
# ▲ Next.js 15.x
# - Local: http://localhost:3000
# - Environments: .env
```

### Steg 4.2: Test API Endpoint (ny terminal)

```bash
# Terminal 2: Test GET endpoint
curl "http://localhost:3000/api/readiness-tree?sessionId=test-session-123"

# Expected output (error is OK för test):
# {"error":"No analysis found for this session. Please run analysis first."}
# 
# Det är FÖRVÄNTAT! Det betyder API:t fungerar
```

### Steg 4.3: Test POST Endpoint

```bash
# Test POST endpoint
curl -X POST http://localhost:3000/api/readiness-tree \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session-123"}'

# Expected output:
# {"error":"No analysis found for this session..."}
#
# Det är FÖRVÄNTAT! Det betyder POST också fungerar
```

✅ **Steg 4 Complete!** API endpoints svarar korrekt.

---

## PHASE 5: INTEGRATE INTO DASHBOARD (20 minuter)

### Steg 5.1: Update Analysis Page

Open: `src/app/analysis/page.tsx`

After the deep analysis completes, add this code:

```typescript
// After line where deep analysis results are fetched, add:

// Fetch the readiness tree
const treeResponse = await fetch(
  `/api/readiness-tree?sessionId=${sessionId}`
);

if (treeResponse.ok) {
  const treeData = await treeResponse.json();
  // Store for component use
  const readinessTree = treeData.tree;
  const summary = treeData.summary;
} else {
  console.warn('Could not fetch readiness tree');
}
```

### Step 5.2: Add Components to Page

In the JSX rendering section, add:

```tsx
// Import components at top
import ReadinessTreeViewer from '@/components/ReadinessTreeViewer';
import ReadinessActionPlanner from '@/components/ReadinessActionPlanner';

// In your JSX, add after deep analysis results:
{readinessTree && (
  <>
    <div className="mt-12">
      <ReadinessTreeViewer 
        tree={readinessTree}
        onBranchClick={(branch) => {
          console.log('Branch clicked:', branch.displayName);
        }}
      />
    </div>
    
    <div className="mt-12">
      <ReadinessActionPlanner 
        tree={readinessTree}
        sessionId={sessionId}
      />
    </div>
  </>
)}
```

### Steg 5.3: Verifiera Integration

```bash
# Dev server redan körande från steg 4

# Öppna browser
open http://localhost:3000

# Navigera till /analysis
# Du ska se:
# ✅ Readiness Tree Viewer (5 grenar)
# ✅ Action Planner (tabs + checklist)
```

✅ **Steg 5 Complete!** Components visas på sidan.

---

## PHASE 6: INTEGRATE WITH DEEP ANALYSIS (15 minuter)

### Steg 6.1: Update Deep Analysis Runner

Open: `src/lib/deep-analysis-runner.ts`

Find the section where analysis completes. Add this code:

```typescript
// After all dimensions analyzed, before returning:

// Build readiness tree from analyzed dimensions
import { buildReadinessTree } from '@/lib/readiness-tree-builder';

const tree = await buildReadinessTree(sessionId);
console.log('📊 Readiness Tree built:', {
  score: tree.totalScore,
  completion: tree.completionScore,
  status: tree.overallReadiness
});

// Return includes tree data
return {
  // ... existing return data ...
  readinessTree: tree,
  summary: summarizeReadinessTree(tree)
};
```

### Steg 6.2: Update Deep Analysis Route

Open: `src/app/api/deep-analysis/route.ts`

After analysis completes (around line 250-290), add:

```typescript
// After runDeepAnalysis completes, add:

try {
  const tree = await buildReadinessTree(sessionId);
  console.log('✅ Tree built automatically');
  
  // Optionally publish via Redis for real-time updates
  await pub.publish(channel, JSON.stringify({
    type: 'progress',
    current: 100,
    total: 100,
    message: 'Readiness tree complete!'
  }));
} catch (err) {
  console.warn('Could not build tree:', err);
}
```

### Steg 6.3: Import Required Functions

At the top of the file, add:

```typescript
import { buildReadinessTree, summarizeReadinessTree } from '@/lib/readiness-tree-builder';
```

✅ **Steg 6 Complete!** Tree byggs automatiskt efter analysis.

---

## PHASE 7: FREJA INTEGRATION (20 minuter)

### Steg 7.1: Update Freja Context

Open: `src/lib/coaching-prompts.ts` or wherever Freja gets context

Add this function:

```typescript
export async function getFrejaCoachingContext(sessionId: string) {
  try {
    const tree = await buildReadinessTree(sessionId);
    const summary = summarizeReadinessTree(tree);
    
    return {
      readinessScore: tree.totalScore,
      status: tree.overallReadiness,
      branches: tree.branches,
      topPriorities: summary.topActions,
      timeline: summary.estimatedTimeToReady,
      headline: summary.headline
    };
  } catch (err) {
    console.warn('Could not get coaching context:', err);
    return null;
  }
}
```

### Steg 7.2: Use in Chat

In your Freja chatbot response handler, add:

```typescript
// When founder asks "What should I work on?"
if (userMessage.toLowerCase().includes('work on') || 
    userMessage.toLowerCase().includes('improve')) {
  
  const coachingContext = await getFrejaCoachingContext(sessionId);
  
  if (coachingContext) {
    return `Based on my analysis:

**Current Status:** ${coachingContext.status} (${coachingContext.readinessScore}%)

**Top Priorities:**
${coachingContext.topPriorities.map(p => `• ${p}`).join('\n')}

**Timeline:** ${coachingContext.timeline} to investor-ready

Let's start with the first priority. What questions do you have?`;
  }
}
```

### Steg 7.3: Verifiera Freja Integration

```bash
# Dev server redan körande

# Öppna chat
# Typ: "What should I focus on?"
# Freja ska svara med tree data från backend ✅
```

✅ **Steg 7 Complete!** Freja använder tree data.

---

## PHASE 8: FULL END-TO-END TEST (15 minuter)

### Steg 8.1: Test Complete Flow

```bash
# Terminal 1: Dev server redan körande
# Just verify it's running:
curl http://localhost:3000/api/readiness-tree?sessionId=test
# Should return 404 error (expected)
```

### Steg 8.2: Manual Test Journey

1. **Open browser:** `http://localhost:3000`
2. **Go to /analysis** or start new analysis
3. **Fill Business Wizard:**
   - Name: "Test Company"
   - Email: "test@example.com"
   - Industry: "SaaS"
   - Stage: "seed"
   - Website: "https://example.com"
4. **Click "Start Analysis"**
5. **Watch progress bar** (0% → 100%)
6. **See Readiness Tree** appear with:
   - 5 branches
   - Progress bars
   - Scores
7. **Click on a branch** to expand details
8. **See Action Planner** with tabs
9. **Chat with Freja** - ask "What should I work on?"
10. **Verify response** uses tree data

✅ **Steg 8 Complete!** Full flow works end-to-end.

---

## PHASE 9: PRODUCTION DEPLOYMENT (30 minuter)

### Steg 9.1: Database Backup

```bash
# Before deploying to production, backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lah backup_*.sql
```

### Steg 9.2: Run Migration on Staging

```bash
# Set staging DB URL
export DATABASE_URL="postgresql://user:pass@staging-db..."

# Run migration
npx prisma migrate deploy

# Verify with:
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'readiness_%';"
```

### Steg 9.3: Deploy to Production

```bash
# If using Vercel:
git add .
git commit -m "feat: Add Readiness Tree system for investor guidance"
git push origin main

# Vercel will auto-deploy
# Monitor build at: https://vercel.com/your-project

# If using Railway/other:
# Follow your deployment process
# Make sure environment variables are set
# Run migration: npx prisma migrate deploy
```

### Steg 9.4: Monitor Production

```bash
# Check Sentry for errors
open https://sentry.io/your-project

# Monitor API
curl https://your-production-url.com/api/readiness-tree?sessionId=test
# Should return 404 (expected)

# Test full flow with real user
# Monitor logs for any issues
```

✅ **Steg 9 Complete!** Production deployed.

---

## PHASE 10: MONITORING & ITERATION (Ongoing)

### Steg 10.1: Track Metrics

Set up monitoring for:

```bash
# 1. API response time
# Track /api/readiness-tree response times

# 2. Tree building errors
# Count how many fail to build

# 3. User engagement
# Track clicks on branches
# Track checklist completion

# 4. Score improvements
# How much do scores improve per week?
```

### Steg 10.2: Gather Feedback

```bash
# Add to Freja:
# "How helpful is this tree? (1-5)"
# "What's missing?"

# Monitor:
# - Tree usage patterns
# - Which branches are most viewed
# - Average time to "investor ready"
```

### Steg 10.3: Iterate

Based on feedback:
- Adjust scoring weights
- Add new dimensions
- Improve Freja guidance
- Add more templates

✅ **System is Live!** Monitor and iterate.

---

## 🐛 TROUBLESHOOTING

### Issue: "No analysis found"

```bash
# This is EXPECTED if:
# - No deep analysis has been run yet
# - sessionId doesn't exist

# Solution:
# 1. Run deep analysis first
# 2. Then fetch tree
```

### Issue: "Type errors during build"

```bash
# Run type check:
npx tsc --noEmit

# Fix any errors reported

# Common issue: Missing imports
# Add to top of file:
import { buildReadinessTree, summarizeReadinessTree } from '@/lib/readiness-tree-builder';
```

### Issue: "Components not rendering"

```bash
# Check browser console for React errors
# Verify components are exported correctly:

// In ReadinessTreeViewer.tsx
export const ReadinessTreeViewer: React.FC<...> = (...) => {}
export default ReadinessTreeViewer;

// Same for ReadinessActionPlanner.tsx
```

### Issue: "API returns 500 error"

```bash
# Check server logs:
# npm run dev should show error details

# Common issues:
# - Database connection failed
# - Missing environment variables
# - sessionId not found

# Check .env file has:
DATABASE_URL=postgresql://...
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Phase 1: Database migration successful
- [ ] Phase 2: All code files exist
- [ ] Phase 3: TypeScript compile succeeds
- [ ] Phase 4: API endpoints respond
- [ ] Phase 5: Components render on page
- [ ] Phase 6: Tree auto-builds after analysis
- [ ] Phase 7: Freja uses tree data
- [ ] Phase 8: End-to-end flow works
- [ ] Phase 9: Production deployed
- [ ] Phase 10: Monitoring set up

---

## 📊 TIMELINE

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Database | 10 min | Ready |
| 2 | Verify Code | 5 min | Ready |
| 3 | Compile | 10 min | Ready |
| 4 | API Test | 10 min | Ready |
| 5 | Dashboard Integration | 20 min | 👈 START HERE |
| 6 | Deep Analysis Integration | 15 min | Next |
| 7 | Freja Integration | 20 min | Next |
| 8 | End-to-End Test | 15 min | Next |
| 9 | Production Deploy | 30 min | Final |
| 10 | Monitoring | Ongoing | Post-launch |

**Total Time: ~2-3 hours** to full deployment

---

## 🎯 START HERE - QUICK SUMMARY

```bash
# 1. Database (already done - migration ready)
npx prisma migrate dev --name add_readiness_tree

# 2. Check types compile
npm run build

# 3. Start dev server
npm run dev

# 4. Integrate into dashboard
# Edit src/app/analysis/page.tsx
# Add ReadinessTreeViewer and ReadinessActionPlanner components

# 5. Test in browser
open http://localhost:3000/analysis

# 6. Deploy to production
git push origin main
```

**That's it!** The system is now live and guiding founders to investor readiness. 🚀
