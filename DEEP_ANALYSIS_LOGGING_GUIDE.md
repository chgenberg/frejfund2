# 🔍 DEEP ANALYSIS LOGGING GUIDE

## ✅ Loggning har lagts till

Jag har lagt till **detaljerad loggning** på alla kritiska checkpoints i Deep Analysis-flödet. Här är vad du ser i server-loggarna:

---

## 📊 LOGGFLÖDE - Steg för steg

### **STEG 1: API ENDPOINT - POST /api/deep-analysis**

```
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.123Z] 🚀 REQUEST RECEIVED
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.125Z] 📝 Payload - SessionID: sess_abc, Business: My Startup, Content: 12456b, Docs: 2
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.126Z] ✅ CHECKPOINT 1 - Validation passed
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.127Z] 🔍 CHECKPOINT 2 - Checking if analysis already running...
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.130Z] ✅ CHECKPOINT 2 - No existing analysis running
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.131Z] 🔍 CHECKPOINT 3 - Checking daily quota...
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.132Z] ℹ️ CHECKPOINT 3 - Quota check skipped (SOFT_QUOTA_ENABLED=false)
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.133Z] 💾 CHECKPOINT 4 - Upserting analysis record...
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.140Z] ✅ CHECKPOINT 4 - Analysis record created/updated
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.141Z] 👤 CHECKPOINT 5 - Auto-publishing founder profile...
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.148Z] 👤 Updating existing user: usr_xyz
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.152Z] ✅ CHECKPOINT 5 - Profile published
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.153Z] 📡 CHECKPOINT 6 - Setting up Redis SSE channel: progress:sess_abc
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.155Z] ✅ CHECKPOINT 6 - Redis SSE channel ready
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.156Z] 🌐 CHECKPOINT 7 - Scraping phase starting...
[DEEP-ANALYSIS-API] [2025-10-27T10:30:45.157Z] 🌐 Scraping website: https://mystartup.com
[DEEP-ANALYSIS-API] [2025-10-27T10:30:47.234Z] ✅ Website scraped successfully - 8456b of content
[DEEP-ANALYSIS-API] [2025-10-27T10:30:47.240Z] ✅ CHECKPOINT 7 - Scraping phase complete
[DEEP-ANALYSIS-API] [2025-10-27T10:30:47.241Z] 🔍 CHECKPOINT 8 - Starting background analysis phase...
[DEEP-ANALYSIS-API] [2025-10-27T10:30:47.242Z] ✅ ORCHESTRATION COMPLETE - API returning immediately (total: 1117ms)
```

✅ **VÅR KOLLAS:**
- ✓ Request validering
- ✓ Duplicate analysis guard
- ✓ Quota system
- ✓ Database uppdatering
- ✓ Profil auto-publish
- ✓ Redis SSE setup
- ✓ Website scraping
- ✓ Background job start

---

### **STEG 2: BACKGROUND RUNNER - Deep Analysis Runner**

```
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.000Z] 🚀 STARTING DEEP ANALYSIS
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.001Z] 📋 Mode: progressive, Content: 20912b, Docs: 2, Business: My Startup
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.002Z] 🔍 STEP 1 - Finding session: sess_abc
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.008Z] ✅ STEP 1 - Session found, UserId: usr_xyz
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.009Z] 💾 STEP 2 - Creating/upserting analysis record...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.020Z] ✅ STEP 2 - Analysis record created, ID: analysis_123
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.021Z] 🗑️ STEP 3 - Clearing old dimensions (mode: progressive)...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.025Z] ✅ STEP 3 - Cleared 0 dimensions, 0 insights
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.026Z] ⚡ STEP 4 - Using FAST MODE (skipping external intelligence)
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.027Z] ✅ STEP 4 - Fast mode initialized
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.028Z] 📊 STEP 5 - Loaded dimensions to analyze: 68 total
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.028Z] 📊 Dimensions: problem-clarity, solution-problem-fit, unique-insight, solution-simplicity...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.029Z] 🔄 STEP 6 - Starting dimension analysis (batchSize: 3, total: 68)...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.030Z] 📦 Processing batch 1/23 (problem-clarity, solution-problem-fit, unique-insight)
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:30:48.031Z] 🔬 Analyzing: Problem Clarity (problem-clarity), Attempt 1/2...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:02.845Z] ✅ Analysis successful: Problem Clarity → Score: 85/100, Confidence: 0.92
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:02.846Z] 💾 Saving dimension results to database...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:02.848Z] ✨ Creating new dimension: problem-clarity (score: 85)
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:02.850Z] 📊 Progress: 1/68 (4%) - Problem Clarity [Problem & Solution]
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:03.153Z] 🔬 Analyzing: Solution-Problem Fit (solution-problem-fit), Attempt 1/2...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:15.234Z] ✅ Analysis successful: Solution-Problem Fit → Score: 72/100, Confidence: 0.88
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:15.235Z] 💾 Saving dimension results to database...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:15.237Z] ✨ Creating new dimension: solution-problem-fit (score: 72)
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:31:15.239Z] 📊 Progress: 2/68 (5%) - Solution-Problem Fit [Problem & Solution]
...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.100Z] 📊 Progress: 68/68 (100%) - Market Consolidation Potential [Market & Competition]
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.101Z] ✅ STEP 6 - All dimensions analyzed!
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.102Z] 📈 STEP 7 - Calculating overall scores...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.110Z] 📊 Found 68 analyzed dimensions
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.111Z] 📊 Average score calculated: 72/100
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.112Z] 📊 Confidence-weighted score: 71/100
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.113Z] 📊 Data completeness: 88% (60/68 high-confidence)
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.114Z] 📊 Investment readiness: 7/10
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.115Z] 💾 STEP 8 - Marking analysis as COMPLETED...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.120Z] ✅ STEP 8 - Analysis marked as COMPLETED
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.121Z] 📢 STEP 9 - Creating investment ad...
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.125Z] 📊 Top strengths (70+): 42 items
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.126Z] 📊 Top risks (<40): 5 items
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.128Z] ✨ Creating new investment ad
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.135Z] ✅ STEP 9 - Investment ad published
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.136Z] ✅ DEEP ANALYSIS COMPLETE!
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z] 📊 FINAL RESULTS:
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z]   - Overall Score: 72/100
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z]   - Confidence-Weighted: 71/100
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z]   - Investment Readiness: 7/10
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z]   - Data Completeness: 88%
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z]   - Dimensions Analyzed: 68
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z]   - Total Time: 294.1s
[DEEP-ANALYSIS-RUNNER] [2025-10-27T10:35:42.137Z] ════════════════════════════════════════════════════
```

✅ **VÅR KOLLAS:**
- ✓ Session lookup
- ✓ Database record creation
- ✓ Dimension loading
- ✓ Batch processing
- ✓ GPT analysis per dimension
- ✓ Database saves
- ✓ Progress updates
- ✓ Score calculations
- ✓ Investment ad creation
- ✓ Final timing

---

### **STEG 3: FRONTEND - SSE Progress Updates**

```
[PROGRESS-SSE] [2025-10-27T10:30:47.243Z] 🔌 SSE connection opened for session: sess_abc
[PROGRESS-SSE] [2025-10-27T10:30:47.244Z] 📡 Controller ready for sess_abc
[PROGRESS-SSE] [2025-10-27T10:30:47.250Z] 📊 Initial status: analyzing, progress: 0%
[PROGRESS-SSE] [2025-10-27T10:30:48.050Z] 📊 Progress update: 1%
[PROGRESS-SSE] [2025-10-27T10:30:48.100Z] 📊 Progress update: 2%
[PROGRESS-SSE] [2025-10-27T10:30:48.150Z] 📊 Progress update: 3%
[PROGRESS-SSE] [2025-10-27T10:30:48.200Z] 📊 Progress update: 4%
...
[PROGRESS-SSE] [2025-10-27T10:35:42.140Z] 📊 Progress update: 100%
[PROGRESS-SSE] [2025-10-27T10:35:42.141Z] ✅ Analysis completed!
[PROGRESS-SSE] [2025-10-27T10:35:42.145Z] 🔌 Client disconnected
```

✅ **VÅR KOLLAS:**
- ✓ SSE connection established
- ✓ Live progress updates
- ✓ Completion event sent
- ✓ Proper disconnection

---

## 🎯 DEBUGGING - VAR KAN DET FASTNA?

### **Problem 1: Analysis fastnar på "analyzing"**
```
❌ Loggar visar:
[DEEP-ANALYSIS-RUNNER] ❌ ERROR analyzing dimension xxx: Timeout
[DEEP-ANALYSIS-RUNNER] ❌ ERROR analyzing dimension xxx: INVALID JSON

✅ Lösning:
- Kontrollera GPT API-anslutning
- Verifiera att OpenAI-nyckel är giltig
- Se till att prompt är korrekt formaterad
```

### **Problem 2: Dimensioner sparas inte**
```
❌ Loggar visar:
[DEEP-ANALYSIS-RUNNER] ✅ Analysis successful: Dimension X → Score: 85
[DEEP-ANALYSIS-RUNNER] ❌ Error saving dimension: Prisma constraint

✅ Lösning:
- Kontrollera database-schema
- Verifiera analysisDimension-kolumnnamn
- Se till att analysisId existerar
```

### **Problem 3: Progress uppdateras inte**
```
❌ Loggar visar:
[PROGRESS-SSE] 📊 Initial status: analyzing, progress: 0%
[PROGRESS-SSE] (ingen uppdatering i 60 sekunder)

✅ Lösning:
- Kontrollera Redis-anslutning
- Verifiera SSE-channel-namn
- Se till att deep-analysis-runner publicerar updates
```

### **Problem 4: Freja använder inte analys-data**
```
❌ Loggar visar:
Analysis status: completed ✓
Dimensions: 68 saved ✓
Men Freja säger: "Deep analysis is still running..."

✅ Lösning:
- Freja kollar analysis.status !== 'completed'
- Verifiera att status uppdateras korrekt
- Se till att GET /api/deep-analysis returnerar rätt data
```

---

## 🔧 HOW TO DEBUG

### **1. Kolla server-loggarna i realtid**
```bash
# Om du kör lokalt:
npm run dev

# Eller på production (se loggarna):
vercel logs --tail
```

### **2. Sök efter specifika fel**
```bash
# Hitta alla ERROR-loggar:
grep "❌ ERROR" server_logs.txt

# Hitta tidstagning:
grep "Total time:" server_logs.txt

# Hitta failed dimensions:
grep "Failed on attempt 2" server_logs.txt
```

### **3. Verifiera database**
```sql
-- Kontrollera om analys startades
SELECT sessionId, status, progress, updatedAt FROM deep_analyses 
WHERE sessionId = 'sess_abc' 
ORDER BY updatedAt DESC LIMIT 1;

-- Kontrollera sparade dimensioner
SELECT count(*), status, avg(score) 
FROM analysis_dimensions 
WHERE analysisId = (SELECT id FROM deep_analyses WHERE sessionId = 'sess_abc') 
GROUP BY status;
```

---

## 📈 PERFORMANCE METRICS

Loggarna visar också timing för varje steg:

```
[Total API response time] ≈ 5ms (returnar omedelbar)
[Scraping time] ≈ 2-3 sekunder
[Per dimension GPT call] ≈ 12-18 sekunder
[Total analysis time] ≈ 4-7 minuter (68 dimensioner)
```

Förväntade tider:
- 🟢 **Grön**: < 5 minuter (bra)
- 🟡 **Gul**: 5-10 minuter (OK, men långsamt)
- 🔴 **Röd**: > 10 minuter (problem)

---

## 📝 LOGG-FORMAT

Varje logg följer format:
```
[MODULE] [TIMESTAMP] [EMOJI] MESSAGE
```

**Emojs betekelse:**
- 🚀 Start
- ✅ Lyckat
- ❌ Fel
- ⚠️ Varning
- 📊 Data/Statistik
- 🔍 Sökning/Koll
- 💾 Database
- 🌐 Web/Scraping
- 🔬 Analysis
- 📡 SSE/Network
- 👤 Användare
- 🔄 Update
- ✨ Create
- 📦 Queue
- 🎯 Complete

