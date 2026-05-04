import { useCallback, useEffect, useRef, useState } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { useAds } from '@/contexts/AdsContext';
import { resolveAdUnitId } from './adUnitIds';
import { devGrantReward } from '@/api/ads';

type Status = 'idle' | 'loading' | 'loaded' | 'showing' | 'rewarded' | 'closed' | 'error';
type DevMetric =
  | 'created'
  | 'load_started'
  | 'loaded'
  | 'show_started'
  | 'closed'
  | 'error'
  | 'disposed'
  | 'listener_attach'
  | 'listener_detach';

export function useRewardedAd(placementKey: string) {
  const { isReady, getPlacement, user } = useAds();
  const adRef = useRef<RewardedAd | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const rewardedRef = useRef(false);
  const closeResolverRef = useRef<((earned: boolean) => void) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const showInProgressRef = useRef(false);
  const loadInProgressRef = useRef(false);
  const pendingReloadRef = useRef(false);
  const mountedRef = useRef(false);
  const placement = getPlacement(placementKey);

  const logDev = useCallback(
    (_event: DevMetric, _details: Record<string, unknown> = {}) => {},
    []
  );

  const detachListeners = useCallback(() => {
    if (!cleanupRef.current) return;
    cleanupRef.current();
    cleanupRef.current = null;
    logDev('listener_detach', { listeners: 4 });
  }, [logDev]);

  const cleanupCurrentAd = useCallback(
    (reason: string) => {
      if (closeResolverRef.current) {
        closeResolverRef.current(false);
        closeResolverRef.current = null;
      }
      detachListeners();
      adRef.current = null;
      rewardedRef.current = false;
      showInProgressRef.current = false;
      loadInProgressRef.current = false;
      logDev('disposed', { reason });
    },
    [detachListeners, logDev]
  );

  const finalizeCurrentAd = useCallback(
    (nextStatus: Extract<Status, 'closed' | 'error'>, earned: boolean, reason: string) => {
      setStatus(nextStatus);
      logDev(nextStatus, { reason, earned });
      if (closeResolverRef.current) {
        closeResolverRef.current(earned);
        closeResolverRef.current = null;
      }
      cleanupCurrentAd(reason);
    },
    [cleanupCurrentAd, logDev]
  );

  const canLoadCurrentPlacement = useCallback(() => {
    return !!isReady && !!user && !!placement && placement.ad_format === 'REWARDED';
  }, [isReady, placement, user]);

  const load = useCallback(() => {
    if (showInProgressRef.current) {
      pendingReloadRef.current = true;
      return;
    }
    if (loadInProgressRef.current) {
      return;
    }

    cleanupCurrentAd('before_load');

    if (!canLoadCurrentPlacement() || !placement || !user) return;

    const ad = RewardedAd.createForAdRequest(resolveAdUnitId(placement), {
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: {
        customData: `${user.id}:${placement.key}`,
      },
    });
    adRef.current = ad;
    rewardedRef.current = false;
    loadInProgressRef.current = true;
    setStatus('loading');
    logDev('created', { placement: placement.key });
    logDev('load_started', { placement: placement.key });

    const loadedSub = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      loadInProgressRef.current = false;
      setStatus('loaded');
      logDev('loaded', { placement: placement.key });
    });
    const earnedSub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardedRef.current = true;
      setStatus('rewarded');
    });
    const closedSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
      finalizeCurrentAd('closed', rewardedRef.current, 'closed_event');
    });
    const errorSub = ad.addAdEventListener(AdEventType.ERROR, () => {
      finalizeCurrentAd('error', false, 'error_event');
    });
    logDev('listener_attach', { listeners: 4 });

    ad.load();

    cleanupRef.current = () => {
      loadedSub();
      earnedSub();
      closedSub();
      errorSub();
    };
  }, [canLoadCurrentPlacement, cleanupCurrentAd, finalizeCurrentAd, logDev, placement, user]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
      cleanupCurrentAd('unmount');
    };
  }, [cleanupCurrentAd, load]);

  const show = useCallback(async (): Promise<boolean> => {
    if (!adRef.current || status !== 'loaded' || showInProgressRef.current) return false;
    showInProgressRef.current = true;
    setStatus('showing');
    logDev('show_started');

    let shouldReloadAfterShow = false;

    try {
      const earnedPromise = new Promise<boolean>((resolve) => {
        closeResolverRef.current = resolve;
      });
      await adRef.current.show();
      const earned = await earnedPromise;
      shouldReloadAfterShow = true;

      // In dev, AdMob's SSV ping cannot reach a LAN backend, so the grant
      // row never lands. Mint it directly via the DEBUG-only endpoint.
      if (earned && __DEV__ && placement) {
        try {
          await devGrantReward(placement.key);
        } catch {}
      }

      return earned;
    } catch (err) {
      console.warn('Rewarded show failed', err);
      finalizeCurrentAd('error', false, 'show_exception');
      return false;
    } finally {
      showInProgressRef.current = false;
      if (pendingReloadRef.current) {
        shouldReloadAfterShow = true;
      }
      pendingReloadRef.current = false;

      if (mountedRef.current && shouldReloadAfterShow) {
        load();
      }
    }
  }, [finalizeCurrentAd, load, logDev, placement, status]);

  return { status, show, reload: load, available: !!placement && isReady };
}
