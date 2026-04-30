export const LEVEL_TITLES = [
  'Novice',
  'Explorer',
  'Adventurer',
  'Pathfinder',
  'Wanderer',
  'Navigator',
  'Trailblazer',
  'Veteran',
  'Expert',
  'Legend',
];

const INITIAL_REQUIRED_XP = 500;
const LEVEL_GROWTH_MULTIPLIER = 1.25;

export type ComputedLevelInfo = {
  level: number;
  title: string;
  current_xp: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  xp_progress_percent: number;
};

// Frontend mirror of backend LevelService.get_level_info.
// Use when you have a user's XP but no dedicated API response (e.g., visiting another user's profile).
export function computeLevelInfo(xp: number): ComputedLevelInfo {
  const safeXp = Math.max(0, xp ?? 0);
  let level = 1;
  let xpForCurrent = 0;
  let requiredDelta = INITIAL_REQUIRED_XP;
  let xpForNext = requiredDelta;

  while (safeXp >= xpForNext) {
    level += 1;
    xpForCurrent = xpForNext;
    requiredDelta = Math.ceil(requiredDelta * LEVEL_GROWTH_MULTIPLIER);
    xpForNext = xpForCurrent + requiredDelta;
  }
  const titleIdx = Math.max(0, Math.min(level - 1, LEVEL_TITLES.length - 1));
  const range = Math.max(1, xpForNext - xpForCurrent);
  const progress = Math.floor(((safeXp - xpForCurrent) / range) * 100);
  return {
    level,
    title: LEVEL_TITLES[titleIdx],
    current_xp: safeXp,
    xp_for_current_level: xpForCurrent,
    xp_for_next_level: xpForNext,
    xp_progress_percent: progress,
  };
}

export function getNextLevelTitle(level: number): string | null {
  if (level >= LEVEL_TITLES.length) return null;
  return LEVEL_TITLES[level] ?? null;
}

export function isLegendaryLevel(level: number): boolean {
  return level >= 9;
}

export type LevelTier = {
  gradient: [string, string, string];
  ringStart: string;
  ringEnd: string;
  badgeBg: string;
  glowColor: string;
  sparkleDensity: number; // 0-1: how many decorative sparkles to render
};

const LEVEL_TIERS: LevelTier[] = [
  // Levels 1-2 — Stone (Novice)
  {
    gradient: ['#475569', '#64748B', '#94A3B8'],
    ringStart: '#CBD5E1',
    ringEnd: '#94A3B8',
    badgeBg: '#334155',
    glowColor: 'rgba(148,163,184,0.4)',
    sparkleDensity: 0.2,
  },
  {
    gradient: ['#475569', '#64748B', '#94A3B8'],
    ringStart: '#CBD5E1',
    ringEnd: '#94A3B8',
    badgeBg: '#334155',
    glowColor: 'rgba(148,163,184,0.4)',
    sparkleDensity: 0.2,
  },
  // Levels 3-4 — Emerald (Adventurer)
  {
    gradient: ['#065F46', '#16A34A', '#4ADE80'],
    ringStart: '#86EFAC',
    ringEnd: '#22C55E',
    badgeBg: '#047857',
    glowColor: 'rgba(74,222,128,0.5)',
    sparkleDensity: 0.4,
  },
  {
    gradient: ['#065F46', '#16A34A', '#4ADE80'],
    ringStart: '#86EFAC',
    ringEnd: '#22C55E',
    badgeBg: '#047857',
    glowColor: 'rgba(74,222,128,0.5)',
    sparkleDensity: 0.4,
  },
  // Levels 5-6 — Sapphire (Wanderer)
  {
    gradient: ['#0C4A6E', '#0284C7', '#38BDF8'],
    ringStart: '#7DD3FC',
    ringEnd: '#0EA5E9',
    badgeBg: '#075985',
    glowColor: 'rgba(56,189,248,0.55)',
    sparkleDensity: 0.55,
  },
  {
    gradient: ['#0C4A6E', '#0284C7', '#38BDF8'],
    ringStart: '#7DD3FC',
    ringEnd: '#0EA5E9',
    badgeBg: '#075985',
    glowColor: 'rgba(56,189,248,0.55)',
    sparkleDensity: 0.55,
  },
  // Levels 7-8 — Amethyst (Trailblazer)
  {
    gradient: ['#4C1D95', '#7C3AED', '#C4B5FD'],
    ringStart: '#DDD6FE',
    ringEnd: '#A78BFA',
    badgeBg: '#5B21B6',
    glowColor: 'rgba(167,139,250,0.6)',
    sparkleDensity: 0.75,
  },
  {
    gradient: ['#4C1D95', '#7C3AED', '#C4B5FD'],
    ringStart: '#DDD6FE',
    ringEnd: '#A78BFA',
    badgeBg: '#5B21B6',
    glowColor: 'rgba(167,139,250,0.6)',
    sparkleDensity: 0.75,
  },
  // Levels 9-10 — Sunfire (Legend)
  {
    gradient: ['#7C2D12', '#D97706', '#FCD34D'],
    ringStart: '#FDE68A',
    ringEnd: '#F59E0B',
    badgeBg: '#92400E',
    glowColor: 'rgba(252,211,77,0.7)',
    sparkleDensity: 1,
  },
  {
    gradient: ['#7C2D12', '#D97706', '#FCD34D'],
    ringStart: '#FDE68A',
    ringEnd: '#F59E0B',
    badgeBg: '#92400E',
    glowColor: 'rgba(252,211,77,0.7)',
    sparkleDensity: 1,
  },
];

export function getLevelTier(level: number): LevelTier {
  const idx = Math.max(0, Math.min(level - 1, LEVEL_TIERS.length - 1));
  return LEVEL_TIERS[idx];
}
