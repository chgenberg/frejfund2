# Prisma Setup Guide for FrejFund

## ✅ What's Already Done

1. **Installed Prisma**: `@prisma/client` and `prisma` CLI
2. **Created Schema**: `prisma/schema.prisma` with all tables
3. **Created Migration SQL**: `prisma/migrations/20241230_init/migration.sql`
4. **Created Prisma Client**: `src/lib/prisma.ts`

## 📋 Next Steps

### 1. Get Public Database URL from Railway

Railway's internal URL (`postgres.railway.internal`) only works inside Railway containers.

For local development, you need the **public** URL:

1. Go to Railway → Your Project → PostgreSQL service
2. Click "Connect" tab
3. Copy the **Public** database URL (starts with `postgres://...@region.railway.app:...`)
4. It should look like:
   ```
   postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:PORT/railway
   ```

### 2. Update Environment Variables

Create/Update `.env.local`:

```env
# Railway Public URL (for local development)
DATABASE_URL="postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:PORT/railway"

# OpenAI
OPENAI_API_KEY="your-actual-key"
OPENAI_CHAT_MODEL="gpt-5-mini"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cron
CRON_SECRET="local-secret-change-me"
```

### 3. Run Migrations

**Option A: Using Prisma CLI (Recommended)**

```bash
npx prisma migrate deploy
```

**Option B: Manual SQL (if Prisma fails)**

```bash
# Connect to Railway PostgreSQL
psql "postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:PORT/railway"

# Then run:
\i prisma/migrations/20241230_init/migration.sql
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Test the Connection

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

## 🗂️ Database Schema

### Tables Created:

- **users** - User accounts and business info
- **sessions** - Chat sessions with business context
- **messages** - Chat message history
- **integrations** - OAuth integrations (Gmail, Slack, etc)
- **documents** - Vector embeddings for RAG
- **insights** - Daily Compass and proactive insights
- **feedback** - User feedback on AI responses

### Key Features:

- ✅ **pgvector extension** for AI embeddings
- ✅ **Foreign keys** with cascade deletes
- ✅ **Indexes** on frequently queried fields
- ✅ **JSON fields** for flexible metadata
- ✅ **Timestamps** for all records

## 🚀 Usage Examples

### Create a User

```typescript
import prisma from '@/lib/prisma';

const user = await prisma.user.create({
  data: {
    email: 'founder@startup.com',
    name: 'Christopher',
    company: 'FrejFund',
    industry: 'SaaS',
    stage: 'early-revenue',
  },
});
```

### Create a Session

```typescript
const session = await prisma.session.create({
  data: {
    userId: user.id,
    businessInfo: {
      company: 'FrejFund',
      industry: 'SaaS',
      revenue: '$50K MRR',
    },
  },
});
```

### Save Chat Messages

```typescript
await prisma.message.create({
  data: {
    sessionId: session.id,
    role: 'user',
    content: 'What should I focus on today?',
    tokens: 150,
    latencyMs: 2500,
    cost: 0.003,
    model: 'gpt-5-mini',
  },
});
```

### Store Integration

```typescript
await prisma.integration.create({
  data: {
    userId: user.id,
    provider: 'gmail',
    status: 'connected',
    accessToken: encryptedToken,
    refreshToken: encryptedRefreshToken,
    tokenExpiresAt: new Date(Date.now() + 3600000),
    scopes: ['gmail.readonly', 'gmail.metadata'],
    accountEmail: 'founder@startup.com',
  },
});
```

### Create Daily Insight

```typescript
await prisma.insight.create({
  data: {
    userId: user.id,
    type: 'daily_compass',
    title: 'MRR Growth Accelerating',
    description: 'Your MRR grew 12% this week...',
    priority: 'high',
    category: 'revenue',
    data: {
      mrr: 52000,
      growth: 0.12,
    },
  },
});
```

### Vector Search (with Documents)

```typescript
// Store document with embedding
await prisma.$executeRaw`
  INSERT INTO documents (id, "sessionId", content, embedding)
  VALUES (
    ${id},
    ${sessionId},
    ${content},
    ${embedding}::vector
  )
`;

// Search similar documents
const similar = await prisma.$queryRaw`
  SELECT *
  FROM documents
  WHERE "sessionId" = ${sessionId}
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

## 🔧 Prisma Commands

```bash
# View database in browser
npx prisma studio

# Create a new migration
npx prisma migrate dev --name description

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Format schema file
npx prisma format
```

## 🔐 Security Notes

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Encrypt tokens** before storing in `integrations` table
3. **Use connection pooling** in production (Prisma handles this)
4. **Rotate DATABASE_URL** if exposed

## 📚 Next Features to Add

1. **User Authentication** - NextAuth.js integration
2. **Soft Deletes** - Add `deletedAt` field
3. **Audit Logs** - Track user actions
4. **Rate Limiting** - Per-user API limits
5. **Data Export** - GDPR compliance

## 🐛 Troubleshooting

### "Can't reach database server"

- Check if DATABASE_URL is the **public** URL (not `.railway.internal`)
- Verify Railway service is running
- Check firewall/network settings

### "pgvector extension not found"

- Run migration manually: `CREATE EXTENSION IF NOT EXISTS vector;`
- Contact Railway support to enable pgvector

### "P2002: Unique constraint failed"

- User/Integration already exists
- Use `upsert` instead of `create`

## 🎯 Ready to Use!

Once migrations are run, you can start using Prisma in your API routes:

```typescript
import prisma from '@/lib/prisma';

// Prisma is now available everywhere!
const users = await prisma.user.findMany();
```

---

Need help? Check:

- [Prisma Docs](https://www.prisma.io/docs)
- [Railway Docs](https://docs.railway.app)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
