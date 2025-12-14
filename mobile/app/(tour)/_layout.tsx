import React from 'react';
import { Stack } from 'expo-router';

import { TourCreationProvider } from '@/contexts/TourCreationContext';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

export default function TourLayout() {
  const themeKey = useColorTheme();

  return (
    <TourCreationProvider>
      <Stack
        screenOptions={{
          headerTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors[themeKey].primary },
        }}
      />
    </TourCreationProvider>
  );
}