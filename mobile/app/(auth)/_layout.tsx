import { Stack } from 'expo-router';
import React from 'react';

import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';

export default function AuthLayout() {
  const colorTheme = useColorTheme();
  const themeKey = colorTheme ?? 'light';

  return (
    <Stack
      screenOptions={{
        headerShown: true,                
        headerTitle: '',                  
        headerStyle: {
          backgroundColor: Colors[themeKey].primary,
        },
        headerTintColor: Colors[themeKey].text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}