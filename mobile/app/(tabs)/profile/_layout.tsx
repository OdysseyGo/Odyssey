import { Stack } from 'expo-router';
import React from 'react';

import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';

export default function ProfileStackLayout() {
  const colorTheme = useColorTheme();
  const themeKey = colorTheme ?? 'light';

  return (
    <Stack
      screenOptions={{
        headerTitle: '',
        headerShadowVisible: false,
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors[themeKey].primary,
        },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
