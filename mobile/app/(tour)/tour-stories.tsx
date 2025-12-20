import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourLocation } from '@/components/TourCreation/TourCreation.types';
import { TourStoriesStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter } from '@/components/TourCreation/common';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourStoriesScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, setSelectedLocation } = useTourCreation();

  const canProceed = tourData.locations.every(
    (loc) => loc.title.trim().length > 0 && loc.story.trim().length > 0
  );

  const handleNext = () => {
    router.push('/tour-review');
  };

  const handleLocationSelect = useCallback(
    (location: TourLocation) => {
      setSelectedLocation(location);
      router.push('/edit-location');
    },
    [setSelectedLocation]
  );

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <StepIndicator steps={STEPS} currentStepIndex={2} />
      <TourStoriesStep locations={tourData.locations} onLocationSelect={handleLocationSelect} />
      <CreationFooter buttonText="Continue" onPress={handleNext} disabled={!canProceed} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
