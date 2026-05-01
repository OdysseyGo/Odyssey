import React, { useEffect } from 'react';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { shouldShowDisclaimer } from '@/lib/disclaimer';

export default function AppEntryScreen() {
  useEffect(() => {
    let isMounted = true;

    async function chooseInitialScreen() {
      const showDisclaimer = await shouldShowDisclaimer();
      if (!isMounted) return;

      router.replace(showDisclaimer ? '/disclaimer' : '/(tabs)/map');
      requestAnimationFrame(() => {
        SplashScreen.hideAsync();
      });
    }

    chooseInitialScreen();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
