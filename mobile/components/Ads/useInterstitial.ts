import { useEffect, useRef } from 'react';
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

export function useInterstitial(placementKey: string) {
  const { isAdFree, isReady, getPlacement } = useAds();
  const adRef = useRef<InterstitialAd | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isReady || isAdFree) return;
    const placement = getPlacement(placementKey);
    if (!placement || placement.ad_format !== 'INTERSTITIAL') return;
    if (placement.remaining_today <= 0) return;

    const ad = InterstitialAd.createForAdRequest(resolveAdUnitId(placement), {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;

    const loadedSub = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    const errorSub = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn('Interstitial error', err);
    });

    ad.load();

    return () => {
      loadedSub();
      errorSub();
      adRef.current = null;
      loadedRef.current = false;
    };
  }, [isReady, isAdFree, placementKey, getPlacement]);

  const show = async (): Promise<boolean> => {
    if (!adRef.current || !loadedRef.current) return false;
    try {
      await adRef.current.show();
      reportImpression(placementKey, uuid()).catch(() => {});
      return true;
    } catch (err) {
      console.warn('Interstitial show failed', err);
      return false;
    }
  };

  return { show, isLoaded: () => loadedRef.current };
}
