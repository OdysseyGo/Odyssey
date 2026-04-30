import { BADGE_TIER_BY_CODE, BadgeTier, XP_LABEL_BY_CODE } from '@/constants/badgeTheme';

export function getBadgeTier(code?: string | null): BadgeTier {
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
