import { useCallback, useEffect, useRef, useState } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { useAds } from '@/contexts/AdsContext';
import { resolveAdUnitId } from './adUnitIds';

type Status = 'idle' | 'loading' | 'loaded' | 'showing' | 'rewarded' | 'closed' | 'error';

export function useRewardedAd(placementKey: string) {
  const { isReady, getPlacement, user } = useAds();
  const adRef = useRef<RewardedAd | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const rewardedRef = useRef(false);

  const placement = getPlacement(placementKey);

  const load = useCallback(() => {
    if (!isReady || !placement || placement.ad_format !== 'REWARDED' || !user) return;

    const ad = RewardedAd.createForAdRequest(resolveAdUnitId(placement), {
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: {
        customData: `${user.id}:${placement.key}`,
      },
    });
    adRef.current = ad;
    rewardedRef.current = false;
    setStatus('loading');

    const loadedSub = ad.addAdEventListener(RewardedAdEventType.LOADED, () => setStatus('loaded'));
    const earnedSub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardedRef.current = true;
      setStatus('rewarded');
    });
    const closedSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setStatus(rewardedRef.current ? 'closed' : 'closed');
    });
    const errorSub = ad.addAdEventListener(AdEventType.ERROR, () => setStatus('error'));

    ad.load();

    return () => {
      loadedSub();
      earnedSub();
      closedSub();
      errorSub();
    };
  }, [isReady, placement, user]);

  useEffect(() => {
    const cleanup = load();
    return () => cleanup?.();
  }, [load]);

  const show = useCallback(async (): Promise<boolean> => {
    if (!adRef.current || status !== 'loaded') return false;
    try {
      setStatus('showing');
      await adRef.current.show();
      // Reward outcome is reported via the EARNED_REWARD listener;
      // SSV will hit the backend asynchronously.
      return rewardedRef.current;
    } catch (err) {
      console.warn('Rewarded show failed', err);
      setStatus('error');
      return false;
    }
  }, [status]);

  return { status, show, reload: load, available: !!placement && isReady };
}
