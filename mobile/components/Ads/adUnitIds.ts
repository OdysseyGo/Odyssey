import { TestIds } from 'react-native-google-mobile-ads';
import type { AdPlacement } from '@/api/ads';

export function resolveAdUnitId(placement: AdPlacement): string {
  if (__DEV__ || !placement.ad_unit_id) {
    if (placement.ad_format === 'BANNER') return TestIds.BANNER;
    if (placement.ad_format === 'INTERSTITIAL') return TestIds.INTERSTITIAL;
    return TestIds.REWARDED;
  }
  return placement.ad_unit_id;
}
