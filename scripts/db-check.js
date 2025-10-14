/*
  Quick DB sanity check
  Run with: DATABASE_URL=... node scripts/db-check.js
*/
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('🔌 Connecting to DB...');

    const [users, sessions, analyses, dims, insights, vcUsers] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.session.count().catch(() => 0),
      prisma.deepAnalysis.count().catch(() => 0),
      prisma.analysisDimension.count().catch(() => 0),
      prisma.analysisInsight.count().catch(() => 0),
      prisma.vCUser.count().catch(() => 0),
    ]);

    console.log('\n=== Counts ===');
    console.log('Users:', users);
    console.log('Sessions:', sessions);
    console.log('DeepAnalyses:', analyses);
    console.log('AnalysisDimensions:', dims);
    console.log('AnalysisInsights:', insights);
    console.log('VCUsers:', vcUsers);

    console.log('\n=== Latest Sessions (5) ===');
    const latestSessions = await prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, userId: true, createdAt: true, businessInfo: true }
    }).catch(() => []);
    latestSessions.forEach(s => {
      console.log(`- ${s.id} user=${s.userId || 'null'} created=${s.createdAt?.toISOString?.() || s.createdAt}`);
      try {
        const bi = s.businessInfo || {};
        console.log(`  company=${bi.name || bi.companyName || 'n/a'} stage=${bi.stage || 'n/a'} revenue=${bi.monthlyRevenue || 'n/a'}`);
      } catch {}
    });

    console.log('\n=== Latest DeepAnalyses (5) ===');
    const latestAnalyses = await prisma.deepAnalysis.findMany({
      orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }],
      take: 5,
      select: {
        id: true, sessionId: true, status: true, progress: true,
        overallScore: true, investmentReadiness: true, completedAt: true, startedAt: true
      }
    }).catch(() => []);
    latestAnalyses.forEach(a => {
      console.log(`- ${a.id} session=${a.sessionId} status=${a.status} progress=${a.progress}% score=${a.overallScore} IR=${a.investmentReadiness} completed=${a.completedAt}`);
    });

    // If there is a latest analysis, show dimension summary
    if (latestAnalyses[0]) {
      const latestId = latestAnalyses[0].id;
      const dimCount = await prisma.analysisDimension.count({ where: { analysisId: latestId } }).catch(() => 0);
      console.log(`\nDimensions for latest analysis (${latestId}): ${dimCount}`);
      const sampleDims = await prisma.analysisDimension.findMany({
        where: { analysisId: latestId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { name: true, category: true, score: true, analyzed: true }
      }).catch(() => []);
      sampleDims.forEach(d => console.log(`- [${d.category}] ${d.name}: ${d.score}% analyzed=${d.analyzed}`));
    }

  } finally {
    await new Promise(res => setTimeout(res, 50));
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('DB check failed:', e);
  process.exit(1);
});


