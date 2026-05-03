import { useCallback, useEffect, useRef } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { useAds } from '@/contexts/AdsContext';
import { reportImpression } from '@/api/ads';
import { resolveAdUnitId } from './adUnitIds';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

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

export function useInterstitial(placementKey: string) {
  const { isReady, getPlacement } = useAds();
  const adRef = useRef<InterstitialAd | null>(null);
  const loadedRef = useRef(false);
  const persistentCleanupRef = useRef<(() => void) | null>(null);
  const showInProgressRef = useRef(false);
  const loadInProgressRef = useRef(false);
  const mountedRef = useRef(false);
  const metricsRef = useRef<Record<DevMetric, number>>({
    created: 0,
    load_started: 0,
    loaded: 0,
    show_started: 0,
    closed: 0,
    error: 0,
    disposed: 0,
    listener_attach: 0,
    listener_detach: 0,
  });

  const logDev = useCallback(
    (event: DevMetric, details: Record<string, unknown> = {}) => {
      if (!__DEV__) return;
      metricsRef.current[event] += 1;
      console.log(`[useInterstitial:${placementKey}] ${event}`, {
        count: metricsRef.current[event],
        ...details,
      });
    },
    [placementKey]
  );

  const isPlacementEligible = useCallback(() => {
    if (!isReady) return null;
    const placement = getPlacement(placementKey);
    if (!placement || placement.ad_format !== 'INTERSTITIAL') return null;
    if (placement.frequency_cap_per_day > 0 && placement.remaining_today <= 0) return null;
    return placement;
  }, [getPlacement, isReady, placementKey]);

  const detachPersistentListeners = useCallback(() => {
    if (!persistentCleanupRef.current) return;
    persistentCleanupRef.current();
    persistentCleanupRef.current = null;
    logDev('listener_detach', { listeners: 2, scope: 'persistent' });
  }, [logDev]);

  const disposeCurrentAd = useCallback(
    (reason: string) => {
      detachPersistentListeners();
      adRef.current = null;
      loadedRef.current = false;
      loadInProgressRef.current = false;
      showInProgressRef.current = false;
      logDev('disposed', { reason });
    },
    [detachPersistentListeners, logDev]
  );

  const loadAd = useCallback(() => {
    if (!mountedRef.current) return;
    if (showInProgressRef.current || loadInProgressRef.current) return;

    const placement = isPlacementEligible();
    if (!placement) {
      disposeCurrentAd('placement_ineligible');
      return;
    }

    disposeCurrentAd('before_load');

    const ad = InterstitialAd.createForAdRequest(resolveAdUnitId(placement), {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;
    loadInProgressRef.current = true;
    logDev('created', { placement: placement.key });
    logDev('load_started', { placement: placement.key });

    const loadedSub = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
      loadInProgressRef.current = false;
      logDev('loaded', { placement: placement.key });
    });

    const errorSub = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn('Interstitial error', err);
      loadedRef.current = false;
      loadInProgressRef.current = false;
      logDev('error', { source: 'load_listener' });
      disposeCurrentAd('load_error');
    });

    logDev('listener_attach', { listeners: 2, scope: 'persistent' });

    persistentCleanupRef.current = () => {
      loadedSub();
      errorSub();
    };

    ad.load();
  }, [disposeCurrentAd, isPlacementEligible, logDev]);

  useEffect(() => {
    mountedRef.current = true;
    loadAd();

    return () => {
      mountedRef.current = false;
      disposeCurrentAd('unmount');
    };
  }, [disposeCurrentAd, loadAd]);

  const show = useCallback(async (): Promise<boolean> => {
    if (!adRef.current || !loadedRef.current || showInProgressRef.current) return false;

    const ad = adRef.current;
    showInProgressRef.current = true;
    logDev('show_started');

    try {
      await new Promise<void>((resolve) => {
        let tempClosedSub: () => void = () => {};
        let tempErrorSub: () => void = () => {};
        let fallbackTimer: ReturnType<typeof setTimeout>;
        let settled = false;

        const detachTempListeners = () => {
          tempClosedSub();
          tempErrorSub();
          logDev('listener_detach', { listeners: 2, scope: 'temporary' });
        };

        const finalize = (kind: 'closed' | 'error' | 'timeout' | 'show_catch') => {
          if (settled) return;
          settled = true;

          clearTimeout(fallbackTimer);
          detachTempListeners();
          loadedRef.current = false;
          showInProgressRef.current = false;

          if (kind === 'closed') {
            logDev('closed');
          } else {
            logDev('error', { source: kind });
          }

          disposeCurrentAd(`show_finalize_${kind}`);

          if (mountedRef.current && isPlacementEligible()) {
            loadAd();
          }

          resolve();
        };

        tempClosedSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
          finalize('closed');
        });
        tempErrorSub = ad.addAdEventListener(AdEventType.ERROR, () => {
          finalize('error');
        });
        logDev('listener_attach', { listeners: 2, scope: 'temporary' });

        fallbackTimer = setTimeout(() => {
          finalize('timeout');
        }, 30000);

        ad.show()
          .then(() => reportImpression(placementKey, uuid()).catch(() => {}))
          .catch((err) => {
            console.warn('Interstitial show failed', err);
            finalize('show_catch');
          });
      });

      return true;
    } catch (err) {
      console.warn('Interstitial show failed', err);
      showInProgressRef.current = false;
      return false;
    }
  }, [disposeCurrentAd, isPlacementEligible, loadAd, logDev, placementKey]);

  return { show, isLoaded: () => loadedRef.current };
}
