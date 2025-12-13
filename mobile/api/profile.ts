import { apiRequest } from './APIClient';

export type Badge = {
  id: number;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  created_at: string;
};

export type BadgesListResponse = {
  count: number;
  next?: string;
  previous?: string;
  results: Badge[];
};

export const getMyBadges = () =>
  apiRequest<BadgesListResponse>({
    method: 'get',
    url: `/api/my-badges/`,
  });