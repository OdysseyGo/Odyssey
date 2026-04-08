import React from 'react';
import { Stack } from 'expo-router';

import { TourCreationProvider } from '@/contexts/TourCreationContext';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import BackButton from '@/components/common/BackButton';

export default function TourLayout() {
  const themeKey = useColorTheme();

  return (
    <TourCreationProvider>
      <Stack
        screenOptions={{
          headerTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors[themeKey].primary },
          headerLeft: () => <BackButton color="#FFFFFF" />,
        }}
      />
    </TourCreationProvider>
  );
}
