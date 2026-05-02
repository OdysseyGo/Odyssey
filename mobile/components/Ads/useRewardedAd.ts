import { useCallback, useEffect, useRef, useState } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { useAds } from '@/contexts/AdsContext';
import { resolveAdUnitId } from './adUnitIds';
import { devGrantReward } from '@/api/ads';

type Status = 'idle' | 'loading' | 'loaded' | 'showing' | 'rewarded' | 'closed' | 'error';

export function useRewardedAd(placementKey: string) {
  const { isReady, getPlacement, user } = useAds();
  const adRef = useRef<RewardedAd | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const rewardedRef = useRef(false);
  const closeResolverRef = useRef<((earned: boolean) => void) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const placement = getPlacement(placementKey);

  const cleanupCurrentAd = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    adRef.current = null;
  }, []);

  const load = useCallback(() => {
    cleanupCurrentAd();

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
      const earned = rewardedRef.current;
      setStatus('closed');
      closeResolverRef.current?.(earned);
      closeResolverRef.current = null;
    });
    const errorSub = ad.addAdEventListener(AdEventType.ERROR, () => {
      setStatus('error');
      closeResolverRef.current?.(false);
      closeResolverRef.current = null;
    });

    ad.load();

    cleanupRef.current = () => {
      loadedSub();
      earnedSub();
      closedSub();
      errorSub();
    };
  }, [cleanupCurrentAd, isReady, placement, user]);

  useEffect(() => {
    load();
    return () => cleanupCurrentAd();
  }, [cleanupCurrentAd, load]);

  const show = useCallback(async (): Promise<boolean> => {
    if (!adRef.current || status !== 'loaded') return false;
    try {
      setStatus('showing');
      const earnedPromise = new Promise<boolean>((resolve) => {
        closeResolverRef.current = resolve;
      });
      await adRef.current.show();
      const earned = await earnedPromise;
      // In dev, AdMob's SSV ping cannot reach a LAN backend, so the grant
      // row never lands. Mint it directly via the DEBUG-only endpoint.
      if (earned && __DEV__ && placement) {
        try {
          await devGrantReward(placement.key);
        } catch (err) {
          console.warn('devGrantReward failed', err);
        }
      }
      // Reload for next use
      load();
      return earned;
    } catch (err) {
      console.warn('Rewarded show failed', err);
      setStatus('error');
      closeResolverRef.current = null;
      return false;
    }
  }, [status, load, placement]);

  return { status, show, reload: load, available: !!placement && isReady };
}
