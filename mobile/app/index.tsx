import React, { useEffect } from 'react';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { shouldShowDisclaimer } from '@/lib/disclaimer';
import { getCurrentUser } from '@/api/auth';

export default function AppEntryScreen() {
  useEffect(() => {
    let isMounted = true;

    async function chooseInitialScreen() {
      const showDisclaimer = await shouldShowDisclaimer();
      if (!isMounted) return;

      if (showDisclaimer) {
        router.replace('/disclaimer');
      } else {
        const user = await getCurrentUser();
        router.replace(user?.terms_update_required ? '/terms-update' : '/(tabs)/map');
      }

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
