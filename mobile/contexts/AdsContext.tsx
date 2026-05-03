import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { usePathname } from 'expo-router';
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
  const pathname = usePathname();
  const [state, setState] = useState<AdsState>({
    isReady: false,
    placements: new Map(),
    user: null,
  });
  const tokenRef = useRef<string | null>(null);
  const adsInitializedRef = useRef(false);
  const isReadyRef = useRef(false);

  useEffect(() => {
    isReadyRef.current = state.isReady;
  }, [state.isReady]);

  const refresh = useCallback(async (tokenOverride?: string | null) => {
    const token =
      tokenOverride !== undefined ? tokenOverride : await SecureStore.getItemAsync('userToken');
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
  }, []);

  const initializeAdsSdk = useCallback(async () => {
    if (adsInitializedRef.current) return;
    try {
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
      await mobileAds().initialize();
      adsInitializedRef.current = true;
    } catch (err) {
      console.warn('AdMob init failed', err);
    }
  }, []);

  const syncAuthState = useCallback(async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token === tokenRef.current && isReadyRef.current) return;

    tokenRef.current = token;
    await refresh(token);

    if (!token) {
      adsInitializedRef.current = false;
      return;
    }
    await initializeAdsSdk();
  }, [initializeAdsSdk, refresh]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (Platform.OS === 'ios') {
        const { status: current } = await getTrackingPermissionsAsync();
        if (current === 'undetermined') {
          await requestTrackingPermissionsAsync();
        }
      }

      await syncAuthState();
      if (cancelled) return;
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [syncAuthState]);

  useEffect(() => {
    syncAuthState();
  }, [pathname, syncAuthState]);

  const getPlacement = useCallback(
    (key: string) => state.placements.get(key),
    [state.placements]
  );

  const contextValue = useMemo(
    () => ({
      ...state,
      getPlacement,
      refresh,
    }),
    [state, getPlacement, refresh]
  );

  return (
    <AdsContext.Provider value={contextValue}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('useAds must be used within AdsProvider');
  return ctx;
}
