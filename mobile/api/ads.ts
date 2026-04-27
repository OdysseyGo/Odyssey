import { Platform } from 'react-native';
import { apiRequest } from './APIClient';

export type AdFormat = 'BANNER' | 'INTERSTITIAL' | 'REWARDED';
export type RewardType = 'NONE' | 'CREDITS' | 'AI_SLOT' | 'HINT' | 'REVIVE';

export type AdPlacement = {
  key: string;
  ad_format: AdFormat;
  ad_unit_id: string;
  reward_type: RewardType;
  reward_amount: number;
  frequency_cap_per_day: number;
  min_seconds_between: number;
  remaining_today: number;
};

export type AdConfigResponse = {
  placements: AdPlacement[];
};

export type RewardedAdGrant = {
  id: number;
  placement_key: string;
  reward_type: RewardType;
  reward_amount: number;
  granted_at: string;
  consumed_at: string | null;
};

export const getAdConfig = () =>
  apiRequest<AdConfigResponse>({
    method: 'get',
    url: '/api/ads/config/',
    params: { platform: Platform.OS === 'ios' ? 'ios' : 'android' },
  });

export const reportImpression = (placementKey: string, clientRequestId: string) =>
  apiRequest<void>({
    method: 'post',
    url: '/api/ads/impressions/',
    data: { placement_key: placementKey, client_request_id: clientRequestId },
  }).catch((err) => {
    if (err?.statusCode === 429) return;
    throw err;
  });

export const consumeGrant = (grantId: number, context: Record<string, unknown> = {}) =>
  apiRequest<RewardedAdGrant>({
    method: 'post',
    url: `/api/ads/rewards/${grantId}/consume/`,
    data: { context },
  });
