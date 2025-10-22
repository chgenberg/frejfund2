# Google Search Integration Guide

## Setup

### 1. Get API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Custom Search API**
4. Create credentials → API Key
5. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
6. Create a new search engine → "Search the entire web"
7. Copy the Search Engine ID

### 2. Add to Environment Variables

```bash
# Railway / .env.local
GOOGLE_SEARCH_API_KEY=AIzaSy...
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6...
```

### 3. Run Migration

```bash
npx prisma migrate deploy
```

## Usage Limits

### Per User
- **Daily**: 5 searches
- **Monthly**: 20 searches
- **Cache**: 7 days

### Global
- **Daily**: 80 searches (saves 20 for emergency)
- **API Free Tier**: 100/day, then $5/1000 queries

## Integration Example

### In Deep Analysis

```typescript
// src/lib/deep-analysis-runner.ts
import { searchCompanyIntelligence } from './google-search';

export async function runDeepAnalysis(sessionId: string, businessInfo: any) {
  // ... existing code
  
  // Get user ID
  const userId = sessionId; // or lookup from DB
  
  // Fetch external intelligence with Google Search
  const googleIntel = await searchCompanyIntelligence(
    businessInfo.name || 'Unknown',
    businessInfo.industry || '',
    userId
  );
  
  console.log(`📰 Found ${googleIntel.news.length} news items`);
  console.log(`🏢 Found ${googleIntel.competitors.length} competitors`);
  console.log(`📈 Found ${googleIntel.marketTrends.length} market trends`);
  console.log(`🔍 Quota remaining: ${googleIntel.quotaRemaining}`);
  
  // Add to analysis context
  const externalContext = `
  
RECENT NEWS:
${googleIntel.news.map(n => `- ${n.title}: ${n.snippet} (${n.link})`).join('\n')}

COMPETITORS:
${googleIntel.competitors.map(c => `- ${c.title}: ${c.snippet}`).join('\n')}

MARKET TRENDS:
${googleIntel.marketTrends.map(t => `- ${t.title}: ${t.snippet}`).join('\n')}
  `;
  
  // Use in dimension analysis
  const analysisPrompt = `${fullContent}\n${externalContext}`;
  
  // ... continue analysis
}
```

### Direct Search

```typescript
import { googleSearch } from '@/lib/google-search';

const result = await googleSearch(
  '"Acme Corp" funding news',
  userId,
  {
    maxResults: 5,
    dateRestrict: 'd7', // Last 7 days
    exactTerms: 'Series A',
  }
);

if (result.error) {
  console.error('Search failed:', result.error);
} else {
  console.log('Results:', result.results);
  console.log('Cached:', result.cached);
  console.log('Quota remaining:', result.quotaRemaining);
}
```

### Check User Quota

```typescript
import { getUserSearchQuota } from '@/lib/google-search';

const quota = await getUserSearchQuota(userId);
console.log(`Daily: ${quota.dailyRemaining}/${quota.dailyLimit}`);
console.log(`Monthly: ${quota.monthlyRemaining}/${quota.monthlyLimit}`);
```

## Features

### ✅ Rate Limiting
- Per-user daily and monthly limits
- Global daily limit to prevent API overages
- Graceful degradation when limits hit

### ✅ Smart Caching
- 7-day browser localStorage cache
- Reduces API calls for repeat searches
- Cache invalidation after expiry

### ✅ Cost Control
- Max 80 searches/day globally
- User limits prevent abuse
- Cached results don't count against quota

### ✅ Quota Tracking
- Database logging of all searches
- Real-time quota checking
- API endpoint for quota status

## Cost Estimate

### Free Tier (100/day)
- **Current Setup**: 80 max/day
- **Cost**: $0/month
- **Users**: ~16 analyses/day (5 searches each)

### Paid Tier ($5/1000)
- **100 users/day**: 500 searches = $2.50/day = $75/month
- **200 users/day**: 1000 searches = $5/day = $150/month

## Monitoring

### Check Daily Usage

```sql
-- Today's searches (all users)
SELECT COUNT(*) FROM google_search_logs 
WHERE DATE(createdAt) = CURRENT_DATE;

-- By user
SELECT userId, COUNT(*) as searches
FROM google_search_logs
WHERE DATE(createdAt) = CURRENT_DATE
GROUP BY userId
ORDER BY searches DESC;

-- Cached vs API calls
SELECT cached, COUNT(*) 
FROM google_search_logs
WHERE DATE(createdAt) = CURRENT_DATE
GROUP BY cached;
```

### Railway Dashboard

Add to your monitoring:
```typescript
// src/app/api/admin/search-stats/route.ts
export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await prisma.googleSearchLog.groupBy({
    by: ['cached'],
    where: { createdAt: { gte: today } },
    _count: true,
  });
  
  return NextResponse.json({
    date: today,
    apiCalls: stats.find(s => !s.cached)?._count || 0,
    cachedCalls: stats.find(s => s.cached)?._count || 0,
    limit: 80,
  });
}
```

## Best Practices

1. **Always check quota** before expensive operations
2. **Use caching** - check cache before API calls
3. **Combine searches** - use `searchCompanyIntelligence` for bundled queries
4. **Monitor costs** - set up alerts in Google Cloud Console
5. **Show quota to users** - display remaining searches in UI

## UI Integration

```tsx
// Show user their remaining quota
const QuotaDisplay = ({ userId }: { userId: string }) => {
  const [quota, setQuota] = useState(null);
  
  useEffect(() => {
    fetch(`/api/search/quota?userId=${userId}`)
      .then(r => r.json())
      .then(setQuota);
  }, [userId]);
  
  if (!quota) return null;
  
  return (
    <div className="text-xs text-gray-500">
      Web searches: {quota.dailyRemaining}/{quota.dailyLimit} today
    </div>
  );
};
```

## Troubleshooting

### "Daily limit exceeded"
- User hit 5 searches today
- Wait until tomorrow or increase USER_DAILY_LIMIT

### "Global daily search limit reached"
- All users combined hit 80 searches
- Increase GLOBAL_DAILY_LIMIT or wait until tomorrow

### "Search API not configured"
- Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID
- Check environment variables in Railway

### Empty results
- Query too specific
- Try broader search terms
- Check Google Cloud Console for API errors

