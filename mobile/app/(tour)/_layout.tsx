import React from 'react';
import { Stack } from 'expo-router';

import { TourCreationProvider } from '@/contexts/TourCreationContext';

export default function TourLayout() {
  return (
    <TourCreationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </TourCreationProvider>
  );
}
