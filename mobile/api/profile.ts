import { apiRequest } from './APIClient';

export type Badge = {
  id: number;
  code?: string | null;
  name: string;
  description: string;
  icon?: string | null;
  criteria: Record<string, unknown>;
  created_at: string;
};

export type UserBadge = {
  id: number;
  user: number;
  badge: Badge;
  city: string;
  country_code: string;
  mistake_count?: number | null;
  source_tour?: number | null;
  earned_at: string;
  visual_config?: Record<string, unknown>;
};

export type BadgesListResponse = {
  count: number;
  next?: string;
  previous?: string;
  results: UserBadge[];
};

export const getMyBadges = () =>
  apiRequest<BadgesListResponse>({
    method: 'get',
    url: `/api/my-badges/`,
  });

export type LevelInfo = {
  level: number;
  title: string;
  current_xp: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  xp_progress_percent: number;
};

export const getLevelInfo = () =>
  apiRequest<LevelInfo>({
    method: 'get',
    url: `/api/level-info/`,
  });
