import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourLocation } from '@/components/TourCreation/TourCreation.types';
import LocationPicker from '@/components/TourCreation/LocationPicker';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourLocationsScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, updateTourData, setSelectedLocation } = useTourCreation();
  const { t } = useTranslation();

  const canProceed = tourData.locations.length >= 2;

  const handleNext = () => {
    router.push('/tour-stories');
  };

  const handleLocationsChange = useCallback(
    (locations: TourLocation[]) => {
      updateTourData({ locations });
    },
    [updateTourData]
  );

  const handleLocationSelect = useCallback(
    (location: TourLocation) => {
      setSelectedLocation(location);
      router.push('/edit-location');
    },
    [setSelectedLocation]
  );

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <CreationHeader title={t('creation.location.title')} />
      <StepIndicator steps={STEPS} currentStepIndex={1} />
      <View style={styles.content}>
        <LocationPicker
          locations={tourData.locations}
          onLocationsChange={handleLocationsChange}
          onLocationSelect={handleLocationSelect}
        />
      </View>
      <CreationFooter
        buttonText={t('creation.continueWithCount', { count: tourData.locations.length })}
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
  content: {
    flex: 1,
  },
});
