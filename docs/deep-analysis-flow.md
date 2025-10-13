# Deep Analysis Flow - Complete Implementation

## 🔄 Hela flödet från start till smart coaching

### **Fas 1: Insamling av data (BusinessWizard)**

```
Användare fyller i:
├── Personlig info (namn, email)
├── Företagsinfo (stage, industry, target market)
├── Traction data (revenue, team size)
├── URL (hemsida) → SKRAPAS automatiskt
└── Dokument (pitch deck, financial model) → EXTRAHERAS
```

**Output:**
- `businessInfo` objekt
- `scrapedContent` från hemsida
- `uploadedDocuments` text från PDF/DOCX

---

### **Fas 2: Initial analys (Snabb feedback)**

```javascript
// I BusinessWizard när användaren klickar "Start Analysis"
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ businessInfo, scrapedContent })
});
```

**Detta sker:**
1. Snabb GPT-analys (10-15 sekunder)
2. Beräknar Investment Readiness Score (0-10)
3. Genererar välkomstmeddelande från Freja
4. Redirectar till `/chat`

---

### **Fas 3: Deep Analysis i bakgrunden (NYTT!)**

Samtidigt som användaren chattar, körs 68 GPT-analyser i bakgrunden:

```javascript
// Triggras automatiskt i ChatInterface useEffect
await fetch('/api/deep-analysis', {
  method: 'POST',
  body: JSON.stringify({
    sessionId,
    businessInfo,
    scrapedContent,
    uploadedDocuments
  })
});
```

**Detta händer (i bakgrunden):**

```
FOR varje dimension (68 st):
  1. Kör GPT-analys med specifik prompt
  2. Extrahera:
     - Score (0-100)
     - Findings (vad vi hittade)
     - Red flags (varningar)
     - Strengths (styrkor)
     - Questions (frågor att ställa)
  3. Spara i database → analysis_dimensions
  
  Progress: 1/68 → 2/68 → ... → 68/68
```

**Efter alla analyser:**
1. Beräkna overall score (medelvärde)
2. Identifiera kritiska insights
3. Generera prioriterade frågor
4. Markera som "completed" i DB

---

### **Fas 4: Freja använder Deep Analysis (Smart Coaching)**

När användaren chattar med Freja:

```javascript
// I openai.ts generateChatResponse()
const deepContext = await getFrejaCoachingContext(sessionId);
const systemPrompt = basePrompt + deepContext;
```

**Freja har nu tillgång till:**

```typescript
DEEP ANALYSIS COMPLETED (68 dimensions analyzed)
Overall Investment Readiness: 5/10
Overall Score: 62/100

**Problem & Solution** (75/100):
  ✅ Strengths: Problem Clarity, Solution-Problem Fit
  ⚠️ Weak areas: Why Now
    - Why Now: No clear market catalyst identified

**Business Model** (45/100):
  ⚠️ Weak areas: Unit Economics, Gross Margin Structure
    - Unit Economics: LTV:CAC ratio of 1.2 is too low (need 3+)
    - Pricing Power: Price-taker in commoditized market

CRITICAL INSIGHTS:
- [CRITICAL] Unit Economics Concern: Your CAC ($500) is too high relative to LTV ($600)
  → Recommendation: Focus on improving retention or increasing prices

KEY QUESTIONS TO ASK FOUNDER:
1. What's your plan to improve LTV:CAC from 1.2 to 3+?
2. How will you defend against competitors undercutting on price?
3. What's your churn rate and why are customers leaving?
```

**Nu kan Freja:**

✅ **Referera specifika fynd:**
> "Jag ser i min analys att din LTV:CAC ratio är bara 1.2. Det är för lågt - du behöver minst 3. Hur planerar du att förbättra detta?"

✅ **Ställa datadrivna frågor:**
> "Du säger att du har product-market fit, men jag saknar data om din churn rate. Vad är den?"

✅ **Utmana med bevis:**
> "Din hemsida säger 'snabb tillväxt' men jag ser inte några siffror. Vad är din faktiska MoM growth?"

✅ **Prioritera kritiska frågor:**
> "Innan vi pratar investerare måste vi fixa din unit economics. Det är den första frågan varje VC kommer ställa."

---

### **Fas 5: Progressiv förbättring**

När användaren svarar på Frejas frågor:

```
Freja: "Vad är din churn rate?"
User: "2% per månad"

→ Systemet uppdaterar analysis_dimensions:
  - retention-metrics: score ökas från 40 → 70
  - findings: ["Monthly churn: 2%", "Annual retention: ~78%"]
  - Ny fråga genereras: "Vilka är de främsta orsakerna till churn?"
```

---

## 📊 Database Schema

### `deep_analyses`
```sql
- id, sessionId (unique), userId
- status: pending → analyzing → completed
- progress: 0-100%
- overallScore: 0-100
- investmentReadiness: 0-10
```

### `analysis_dimensions`
```sql
- id, analysisId, dimensionId (t.ex. 'unit-economics')
- category, name
- score: 0-100
- findings: string[]
- redFlags: string[]
- strengths: string[]
- questions: string[]  ← DESSA STÄLLER FREJA!
- evidence: string[]
```

### `analysis_insights`
```sql
- id, analysisId
- type: strength | weakness | opportunity | threat
- priority: critical | high | medium | low
- title, description, recommendation
- addressed: boolean (har founder fixat detta?)
```

---

## 🚀 Exempel på Frejas beteende

### Scenario 1: Låg score på Unit Economics

```
User: "Hur hittar jag investerare?"

Freja: "Innan vi pratar investerare måste vi addressera en kritisk fråga: 
Jag analyserade din ekonomi och din LTV:CAC ratio är 1.2. Det betyder 
att du tjänar $600 på en kund som kostar $500 att värva.

Investerare vill se minst 3:1, helst 4:1.

Vad är din plan för att antingen:
A) Öka LTV (bättre retention, upsells, prishöjningar)
B) Sänka CAC (effektivare marknadsföring)
C) Båda?

Berätta för mig vilken av dessa du tror har störst potential."
```

### Scenario 2: Saknade dokument

```
User: "Kan du hjälpa mig förbättra min pitch?"

Freja: "Absolut! Men jag ser att du inte har laddat upp någon pitch deck ännu. 
Jag kan ge mycket bättre feedback om jag faktiskt ser decken.

Ladda upp den här så kan jag ge slide-för-slide feedback på:
- Är problemet tydligt formulerat?
- Visar ni rätt metrics för er stage?
- Är era finansiella projektioner realistiska?

Har du en deck du kan dela?"
```

### Scenario 3: Data-driven utmaning

```
User: "Vi har stark product-market fit"

Freja: "Intressant! Vad baserar du det på? I min analys såg jag:
- Din hemsida nämner inga retention metrics
- Jag hittade inga customer testimonials
- Ingen NPS eller satisfaction data

Stark PMF brukar visa sig genom:
- NRR över 110%
- Churn under 2%/månad
- Organisk word-of-mouth growth

Vilken av dessa kan du kvantifiera för mig?"
```

---

## ⚙️ Implementation Checklist

- ✅ Database schema (3 nya tabeller)
- ✅ 68 analysis dimensions definierade
- ✅ Deep analysis runner (background processing)
- ✅ API endpoint (/api/deep-analysis)
- ✅ Freja coaching context integration
- ✅ Auto-trigger i ChatInterface
- ⏳ Migration (kan köras på production)
- ⏳ Background job system (optional för production)
- ⏳ Progress indicator i UI

---

## 🎯 Resultat

Med detta system blir Freja:
- **Data-driven**: Baserar råd på faktisk analys, inte gissningar
- **Proaktiv**: Ställer frågor om det som saknas
- **Utmanande**: Kan ifrågasätta påståenden med bevis
- **Fokuserad**: Prioriterar vad som är viktigast just nu
- **Specifik**: "Din LTV:CAC är 1.2" istället för "berätta om dina metrics"

Detta är exakt vad en riktig investment coach gör! 🚀
