import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { getAdConfig, AdPlacement } from '@/api/ads';
import { getMe, User } from '@/api/users';

interface AdsState {
  isReady: boolean;
  placements: Map<string, AdPlacement>;
  user: User | null;
}

interface AdsContextType extends AdsState {
  getPlacement: (key: string) => AdPlacement | undefined;
  refresh: () => Promise<void>;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdsState>({
    isReady: false,
    placements: new Map(),
    user: null,
  });

  const refresh = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      setState({ isReady: true, placements: new Map(), user: null });
      return;
    }

    try {
      const [config, user] = await Promise.all([getAdConfig(), getMe()]);
      const placements = new Map(config.placements.map((p) => [p.key, p]));
      setState({ isReady: true, placements, user });
    } catch (err) {
      console.warn('AdsContext: failed to fetch config', err);
      setState((s) => ({ ...s, isReady: true }));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (Platform.OS === 'ios') {
        const { status: current } = await getTrackingPermissionsAsync();
        if (current === 'undetermined') {
          await requestTrackingPermissionsAsync();
        }
      }

      await refresh();
      if (cancelled) return;

      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      try {
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
        await mobileAds().initialize();
      } catch (err) {
        console.warn('AdMob init failed', err);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdsContext.Provider
      value={{
        ...state,
        getPlacement: (key) => state.placements.get(key),
        refresh,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('useAds must be used within AdsProvider');
  return ctx;
}
