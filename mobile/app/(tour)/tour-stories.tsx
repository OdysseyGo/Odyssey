import React, { useCallback } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import {
  TourLocation,
  doesLocationMeetTourRequirements,
  isPuzzleValid,
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

  const locationsReady = tourData.locations.every((loc) =>
    doesLocationMeetTourRequirements(loc, tourData.tourType)
  );
  const hasHybridPuzzle =
    tourData.tourType !== 'HYBRID' ||
    tourData.locations.some((location) => isPuzzleValid(location.puzzle));

  const handleNext = () => {
    if (!hasHybridPuzzle) {
      Alert.alert(
        t('creation.stories.hybridPuzzleRequiredTitle', {
          defaultValue: 'Add at least one puzzle',
        }),
        t('creation.stories.hybridPuzzleRequiredMessage', {
          defaultValue:
            'Hybrid tours need at least one location with a completed puzzle before review.',
        })
      );
      return;
    }

    router.push('/tour-review');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/tour-locations');
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
      <CreationHeader title={t('creation.stories.title')} onBack={handleBack} />
      <StepIndicator steps={STEPS} currentStepIndex={2} />
      <TourStoriesStep
        locations={tourData.locations}
        tourType={tourData.tourType}
        onLocationSelect={handleLocationSelect}
      />
      <CreationFooter
        buttonText={t('creation.continue')}
        onPress={handleNext}
        disabled={!locationsReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
