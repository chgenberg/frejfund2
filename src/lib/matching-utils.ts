import prisma from '@/lib/prisma';

export type NormalizedKPIs = {
  mrrScore: number; // 0-100
  growthScore: number; // 0-100
  usersScore: number; // 0-100
  teamScore: number; // 0-100
  composite: number; // 0-100
};

function clamp(x: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, x));
}

export function normalizeKpis(raw: any): NormalizedKPIs {
  // Accepts shapes like { mrr: '$87k', users: '342', growth: '+18% MoM', teamSize: 4 }
  const toNumber = (v: any): number => {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).toLowerCase().replace(/[,\s]/g, '');
    // mrr like $87k → 87000
    const m = s.match(/([\d.]+)(k|m)?/);
    if (!m) return 0;
    let n = parseFloat(m[1]);
    const unit = m[2];
    if (unit === 'k') n *= 1_000;
    if (unit === 'm') n *= 1_000_000;
    return isFinite(n) ? n : 0;
  };

  const mrr = toNumber(raw?.mrr);
  const users = toNumber(raw?.users);
  // growth like '+18% MoM' → 18
  const growthPct = (() => {
    if (!raw?.growth) return 0;
    const s = String(raw.growth).replace(/[^\d.\-]/g, '');
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  })();
  const team = toNumber(raw?.teamSize);

  // Heuristic scaling to 0-100
  const mrrScore = clamp(Math.log10(Math.max(1, mrr)) * 20); // 10k~40, 100k~60, 1M~80
  const usersScore = clamp(Math.log10(Math.max(1, users)) * 20);
  const growthScore = clamp((growthPct + 5) * 3); // -5%→0, 0%→15, 20%→75, 30%→105→clamped 100
  const teamScore = clamp((team / 20) * 100); // 20 ppl → 100

  const composite = clamp(
    Math.round(mrrScore * 0.35 + growthScore * 0.35 + usersScore * 0.15 + teamScore * 0.15),
  );

  return { mrrScore, growthScore, usersScore, teamScore, composite };
}

export function estimateReadiness(businessInfo: any, kpis: NormalizedKPIs): number {
  const stage = String(businessInfo?.stage || '').toLowerCase();
  const base = stage.includes('pre')
    ? 40
    : stage.includes('seed')
      ? 60
      : stage.includes('series a')
        ? 75
        : 65;
  const readiness = clamp(Math.round(base * 0.6 + kpis.composite * 0.4));
  return readiness;
}

export async function computeVcAffinity(
  vcEmail: string,
): Promise<{
  industry: Record<string, number>;
  stage: Record<string, number>;
  geography: Record<string, number>;
}> {
  // Look at past swipes and accepted intros to derive affinity multipliers per dimension.
  const swipes = await prisma.vCSwipe.findMany({ where: { vcEmail } });
  const accepts = await prisma.introRequest.findMany({
    where: { vcEmail, status: { in: ['accepted', 'intro_sent'] } },
  });

  const inc = (map: Record<string, number>, key: string, val = 1) => {
    if (!key) return;
    map[key] = (map[key] || 0) + val;
  };

  const industry: Record<string, number> = {};
  const stage: Record<string, number> = {};
  const geography: Record<string, number> = {};

  for (const s of swipes) {
    const anon = (s.anonymousData as any) || {};
    inc(
      industry,
      String(anon.industry || '').toLowerCase(),
      s.action === 'like' || s.action === 'super_like' ? 1 : -0.2,
    );
    inc(
      stage,
      String(anon.stage || '').toLowerCase(),
      s.action === 'like' || s.action === 'super_like' ? 1 : -0.2,
    );
    inc(
      geography,
      String(anon.geography || '').toLowerCase(),
      s.action === 'like' || s.action === 'super_like' ? 1 : -0.2,
    );
  }
  // Accepted intros count extra
  for (const a of accepts) {
    // We don't store industry/geo on intro, so we can't add here unless we join; ignore for simplicity or boost all by a small factor
    // Future: join session by founderId to pull details.
  }

  const toMultiplier = (map: Record<string, number>) => {
    const out: Record<string, number> = {};
    const values = Object.values(map);
    const max = values.length ? Math.max(...values) : 0;
    const min = values.length ? Math.min(...values) : 0;
    for (const [k, v] of Object.entries(map)) {
      // Scale to 0.9 - 1.15 range
      const norm = max === min ? 1 : (v - min) / (max - min);
      out[k] = 0.9 + norm * 0.25;
    }
    return out;
  };

  return {
    industry: toMultiplier(industry),
    stage: toMultiplier(stage),
    geography: toMultiplier(geography),
  };
}

export function blendMatchScore(params: {
  baseScore: number; // from stage/industry/geo/check
  kpiScore: number; // 0-100
  readinessScore: number; // 0-100
  affinity: { industry?: number; stage?: number; geography?: number };
}): number {
  const { baseScore, kpiScore, readinessScore, affinity } = params;
  const blended =
    baseScore * 0.5 + kpiScore * 0.2 + readinessScore * 0.2 + 100 * 0.1; // affinity applied multiplicatively below
  const multiplier = (affinity.industry || 1) * (affinity.stage || 1) * (affinity.geography || 1);
  return Math.round(clamp(blended * multiplier, 0, 100));
}
