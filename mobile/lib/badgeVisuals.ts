import { BADGE_TIER_BY_CODE, BadgeTier, XP_LABEL_BY_CODE } from '@/constants/badgeTheme';

const ALL_TIERS: BadgeTier[] = [
  'gold',
  'silver',
  'bronze',
  'xp1',
  'xp2',
  'xp3',
  'platinum',
  'diamond',
  'neutral',
];

export function getBadgeTier(
  code?: string | null,
  criteria?: Record<string, unknown> | null
): BadgeTier {
  const rawVisualTier = criteria?.visual_tier;
  if (typeof rawVisualTier === 'string') {
    const normalized = rawVisualTier.toLowerCase() as BadgeTier;
    if (ALL_TIERS.includes(normalized)) {
      return normalized;
    }
  }
  if (!code) {
    return 'neutral';
  }
  return BADGE_TIER_BY_CODE[code] || 'neutral';
}

export function getXpLabel(code?: string | null): string | null {
  if (!code) {
    return null;
  }
  return XP_LABEL_BY_CODE[code] || null;
}

export function isCityBadge(code?: string | null): boolean {
  return Boolean(code && code.startsWith('CITY_'));
}

export function isXpBadge(code?: string | null): boolean {
  return Boolean(code && code.startsWith('XP_'));
}
