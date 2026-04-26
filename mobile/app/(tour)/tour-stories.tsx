import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import {
  TourLocation,
  doesLocationMeetTourRequirements,
} from '@/components/TourCreation/TourCreation.types';
import { TourStoriesStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourStoriesScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, setSelectedLocation } = useTourCreation();
  const { t } = useTranslation();

  const canProceed = tourData.locations.every((loc) =>
    doesLocationMeetTourRequirements(loc, tourData.tourType)
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
      <CreationHeader title={t('creation.stories.title')} />
      <StepIndicator steps={STEPS} currentStepIndex={2} />
      <TourStoriesStep
        locations={tourData.locations}
        tourType={tourData.tourType}
        onLocationSelect={handleLocationSelect}
      />
      <CreationFooter
        buttonText={t('creation.continue')}
        onPress={handleNext}
        disabled={!canProceed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
