export type BadgeTier = 'gold' | 'silver' | 'bronze' | 'xp1' | 'xp2' | 'xp3' | 'neutral';

export type BadgeTierPalette = {
  outerFill: string;
  innerFill: string;
  border: string;
  text: string;
  mutedText: string;
};

export const BADGE_TIER_BY_CODE: Record<string, BadgeTier> = {
  CITY_GOLD: 'gold',
  CITY_SILVER: 'silver',
  CITY_BRONZE: 'bronze',
  XP_100: 'xp1',
  XP_500: 'xp2',
  XP_1000: 'xp3',
};

export const XP_LABEL_BY_CODE: Record<string, string> = {
  XP_100: 'XP I',
  XP_500: 'XP II',
  XP_1000: 'XP III',
};

export const BADGE_TIER_PALETTE: Record<BadgeTier, BadgeTierPalette> = {
  gold: {
    outerFill: '#fef3c7',
    innerFill: '#fcd34d',
    border: '#b45309',
    text: '#78350f',
    mutedText: '#92400e',
  },
  silver: {
    outerFill: '#f1f5f9',
    innerFill: '#cbd5e1',
    border: '#475569',
    text: '#1e293b',
    mutedText: '#334155',
  },
  bronze: {
    outerFill: '#ffedd5',
    innerFill: '#fdba74',
    border: '#9a3412',
    text: '#7c2d12',
    mutedText: '#9a3412',
  },
  xp1: {
    outerFill: '#dbeafe',
    innerFill: '#93c5fd',
    border: '#1d4ed8',
    text: '#1e3a8a',
    mutedText: '#1d4ed8',
  },
  xp2: {
    outerFill: '#dcfce7',
    innerFill: '#86efac',
    border: '#15803d',
    text: '#14532d',
    mutedText: '#166534',
  },
  xp3: {
    outerFill: '#ede9fe',
    innerFill: '#c4b5fd',
    border: '#6d28d9',
    text: '#4c1d95',
    mutedText: '#5b21b6',
  },
  neutral: {
    outerFill: '#e2e8f0',
    innerFill: '#cbd5e1',
    border: '#64748b',
    text: '#0f172a',
    mutedText: '#334155',
  },
};
