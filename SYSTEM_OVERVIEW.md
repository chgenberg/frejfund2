# 🏗️ FREJFUND DEEP ANALYSIS - SYSTEMÖVERSIKT

## 📋 HELA TJÄNSTEN I KORTHET

FrejFund är en **AI-driven investeringsmatchningsplattform** som analyserar startups på 68 dimensioner för att:
- Skapa investeringsprofiler
- Matcha med investerare
- Ge smarta coachingråd via Freja (AI-agent)

---

## 🔄 FLÖDE - STEG FÖR STEG

### **STEG 1: FOUNDER REGISTRERAR SIG**
- Går till Business Wizard
- Fyller i:
  - Personlig info (namn, email)
  - Företagsinfo (namn, industri, stage)
  - Traction data (revenue, team size)
  - Website URL
  - Dokument (pitch deck, finanser)

**Output:** `BusinessInfo` objekt + sessionId

---

### **STEG 2: INITIAL ANALYS (Snabb feedback)**
- Founder klickar "Start Analysis"
- System gör en snabb GPT-analys (10-15 sekunder)
- Beräknar "Investment Readiness Score" (0-10)
- Genererar välkomstmeddelande från Freja
- **Resultat:** Founder se sitt initiala score

**Output:** `AnalysisState` sparad i DB, Founder redirected till `/chat`

---

### **STEG 3: DEEP ANALYSIS I BAKGRUNDEN (NYTT!)**
- Medan founder chattar, körs 68 GPT-analyser i bakgrunden
- API: `POST /api/deep-analysis` triggas automatiskt

**Process:**
1. **Validera** - Säkerställ att analysis inte redan körs (duplicate guard)
2. **Quota check** - Kontrollera daglig limit (valfritt)
3. **Skrapa website** - Hämta 6 sidor från founders website (2-3 sekunder)
4. **Starta background job** - Använd BullMQ eller inline execution
5. **SSE updates** - Frontend får live progress via EventSource

**Progress:** 0-3% (scraping), 3-100% (analysis)

---

### **STEG 4: 68 DIMENSIONER ANALYSERAS (4-7 minuter)**

**Processs för varje dimension:**

1. **Batch loop** - Analysera 2-3 dimensioner parallellt
2. **GPT Call** - Anropa GPT-4 med specific prompt för dimensionen
3. **Parser** - Extrakt JSON-respons:
   - Score (0-100)
   - Findings (3 observations)
   - Strengths (3 positiva signaler)
   - Red Flags (3 varningar)
   - Questions (3 frågor för founder)
   - Evidence (2 citat från innehåll)
   - Confidence (0-1)
4. **Save** - Spara i `analysis_dimensions` tabell
5. **Update Progress** - Publicera via Redis → SSE → Frontend
6. **Retry Logic** - Om timeout: retry upp till 2 gånger

**Dimensioner (68 totalt):**
- Problem & Solution (6)
- Market & Competition (8)
- Business Model & Economics (9)
- Traction & Growth (7)
- Team & Execution (6)
- Go-to-Market (5)
- Product & Technology (5)
- Fundraising & Capital (5)
- Risks & Red Flags (5)
- Customer Validation (4)
- Storytelling & Positioning (3)
- Social Proof & Traction (4)
- Operational Maturity (3)
- Strategic Positioning (3)

---

### **STEG 5: POÄNGSÄTTNING & INSIGHTS**

Efter alla 68 dimensioner analyserade:

1. **Average Score** = medelvärde av alla dimension-scores
2. **Confidence-Weighted Score** = viktat medelvärde (high conf = 1.0, medium = 0.7, low = 0.4)
3. **Data Completeness** = % av dimensioner med high confidence
4. **Investment Readiness** = confidence-weighted score / 10 (0-10 scale)
5. **Critical Red Flags** = identifiera top 5 risk-dimensioner
6. **Top Strengths** = identifiera top 5 strong-dimensioner

**Sparas i DB:**
```
DeepAnalysis {
  sessionId
  status: 'completed'
  progress: 100
  overallScore
  confidenceWeightedScore
  investmentReadiness
  dataCompleteness
  completedAt
}
```

---

### **STEG 6: INVESTMENT AD CREATION**

Systemet skapar automatiskt en "Investment Ad" för VC-dashboard:
- Company name, industry, stage, location
- One-liner pitch
- Seeking amount + valuation
- Key metrics (all scores)
- Top 5 pros/cons
- Status: "published" (sök bar)

**Resultat:** Startup blir synlig för investerare på VC-dashboard

---

### **STEG 7: FREJA ANVÄNDER DEEP ANALYSIS**

När founder chatter med Freja:

1. **Hämta context** - `getFrejaCoachingContext(sessionId)`
2. **Build system prompt** - Inkludera all analysis data:
   ```
   - Overall scores & readiness
   - Per-dimension insights
   - Critical issues (röda flaggor)
   - Top opportunities
   - Smart questions
   - Gap analysis
   ```
3. **Freja svarar** - Kan nu:
   - Referera specifika fynd: "Din LTV:CAC är 1.2, behöver 3+"
   - Ställa datadrivna frågor
   - Utmana antaganden med bevis
   - Prioritera vad som är viktigast
   - Ge konkret coachingråd

**Resultat:** Smart, personlig coaching istället för generiska svar

---

### **STEG 8: PROGRESSIV FÖRBÄTTRING**

När founder svarar på Frejas frågor:
1. System uppdaterar relevant dimension med nytt data
2. Score/confidence kan öka
3. Ny fråga genereras automatiskt
4. Nästa gång Freja chattar, har hon uppdaterad context

**Loop:** Freja frågar → Founder svarar → System uppdaterar → Freja har bättre context

---

## 🎯 HUVUDKOMPONENTER

| Komponent | Vad den gör |
|-----------|------------|
| **BusinessWizard** | Samlar in startup-info från founder |
| **POST /api/deep-analysis** | Orchestrerar hela analysen |
| **DeepAnalysisRunner** | Kör de 68 GPT-analyser |
| **AnalysisDimensions** | Sparar resultat för varje dimension |
| **SSE /progress** | Live progress updates till frontend |
| **getFrejaCoachingContext** | Bygger coaching-prompt från analysis |
| **ChatInterface** | Frontend component, visar progress |
| **InvestmentAd** | VC-dashboard, visar companies |

---

## 📊 DATABASE SCHEMA

### `deep_analyses`
```sql
id, sessionId (unique), userId
status: pending → analyzing → completed
progress: 0-100%
overallScore: 0-100
confidenceWeightedScore: 0-100
investmentReadiness: 0-10
dataCompleteness: 0-100%
businessInfo: JSON
completedAt: timestamp
```

### `analysis_dimensions` (68 rows per analysis)
```sql
id, analysisId, dimensionId
category, name
score: 0-100
findings: string[]
strengths: string[]
redFlags: string[]
questions: string[]
evidence: string[]
confidence: 0-1
analyzed: boolean
analyzedAt: timestamp
```

### `analysis_insights`
```sql
id, analysisId
type: strength | weakness | opportunity | threat
priority: critical | high | medium | low
title, description, recommendation
addressed: boolean
```

### `investment_ads`
```sql
id, analysisId, userId
title, oneLiner, summary
pros: string[], cons: string[]
companyName, industry, stage, location
website, pitchDeck
seekingUsd, valuationUsd
metrics: JSON (all scores)
status: published
isPublic: true
```

---

## ⏱️ TIMING

| Stage | Time |
|-------|------|
| API request handlad | 5-10ms |
| Website scraping | 2-3s |
| Per dimension GPT call | 12-18s |
| **Total for 68 dimensions** | **4-7 min** |
| Score calculation | <1s |
| **Total end-to-end** | **~5-7 min** |

---

## 🔌 API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/deep-analysis` | POST | Starta analys |
| `/api/deep-analysis` | GET | Hämta resultat |
| `/api/deep-analysis/progress` | GET (SSE) | Live progress |
| `/api/deep-analysis/status` | GET | Current status |
| `/api/deep-analysis/update` | POST | Re-analyze specifika dims |

---

## 🎯 KEY FEATURES

✅ **Automated Analysis** - 68 dimensioner analyzed automatically  
✅ **Live Progress** - Frontend sees 0-100% in real-time  
✅ **Smart Coaching** - Freja uses analysis data  
✅ **Data-Driven** - All recommendations backed by analysis  
✅ **Progressive Learning** - System improves as founder answers  
✅ **VC Discovery** - Investment ads makes startups discoverable  
✅ **Error Recovery** - Timeouts + retries handled gracefully  
✅ **Performance** - Batching, caching, memory management  

---

## 🚀 FLOW DIAGRAM

```
Founder fills Wizard
        ↓
POST /api/deep-analysis
        ↓
[API] Validate → Scrape → Setup SSE
        ↓
Background job starts
        ↓
[RUNNER] Load 68 dims
        ↓
For each dim in batches:
  - Call GPT
  - Parse response
  - Save to DB
  - Update progress
        ↓
Calculate scores
        ↓
Mark as COMPLETED
        ↓
Create InvestmentAd
        ↓
Founder sees: "Analysis complete! Score: 72/100"
        ↓
Freja now has full context
        ↓
Founder chats with Freja
        ↓
Freja gives smart, data-driven coaching
        ↓
System updates based on answers
        ↓
Loop continues until ready for investors
```

---

## 💡 EXEMPEL

### Scenario: SaaS Startup

**Input:**
- Name: "TechFlow"
- Industry: SaaS
- Stage: Seed
- Revenue: $5K MRR
- Team: 3 people

**Analysis outputs:**

| Dimension | Score | Findings |
|-----------|-------|----------|
| Problem Clarity | 85 | Clear market problem identified |
| Unit Economics | 45 | LTV:CAC ratio too low (1.2 vs 3+) |
| Market Size | 75 | TAM $500M, SAM $50M |
| Traction | 60 | 3 months revenue, needs growth |
| Team | 80 | Founder has 5yr SaaS experience |

**Final Scores:**
- Overall: 72/100
- Confidence-Weighted: 71/100
- Investment Readiness: 7/10
- Data Completeness: 88%

**Freja says:**
> "Your unit economics is a concern. LTV:CAC is 1.2, but investors want to see 3+. Before pitching VCs, you need to either increase LTV or decrease CAC. Let's focus on that first. What's your current churn rate?"

---

## 🔧 DEBUGGING

Med loggningen du nu har:

1. **Se vilken checkpoint fastnar** → Grep för `❌ ERROR`
2. **Mät performance** → Grep för `Total Time:`
3. **Debug dimensioner** → Grep för `Failed on attempt 2`
4. **Verify data** → SQL queries för database

Se **DEEP_ANALYSIS_LOGGING_GUIDE.md** för detaljer.

---

## ✨ RESULTAT

En **komplett investeringsmatchningsplattform** där:
- Startups får detaljerad feedback automatiskt
- Freja coachvar intelligently
- Investerare hittar bra deals
- Systemet förbättras med varje svar

**Time to value:** ~5-7 minuter från register till actionable insights

---

