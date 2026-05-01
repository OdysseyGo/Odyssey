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
  source_tour_detail?: {
    id: number;
    title: string;
    city?: string;
    country?: string;
    country_code?: string;
  } | null;
  earned_at: string;
  visual_config?: Record<string, unknown>;
};

export type UserBadgeHistory = UserBadge & {
  user_badge?: number | null;
  event_type: 'EARNED' | 'UPGRADED';
};

export type BadgesListResponse = {
  count: number;
  next?: string;
  previous?: string;
  results: UserBadge[];
};

export type BadgeHistoryListResponse = {
  count: number;
  next?: string;
  previous?: string;
  results: UserBadgeHistory[];
};

export const getMyBadges = () =>
  apiRequest<BadgesListResponse>({
    method: 'get',
    url: `/api/my-badges/`,
  });

export const getUserBadges = (userId: string) =>
  apiRequest<BadgesListResponse>({
    method: 'get',
    url: `/api/users/${userId}/badges/`,
  });

export const getMyBadgeHistory = () =>
  apiRequest<BadgeHistoryListResponse>({
    method: 'get',
    url: `/api/my-badge-history/`,
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
