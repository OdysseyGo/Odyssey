import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourDetailsStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourDetailsScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, updateTourData } = useTourCreation();
  const { t } = useTranslation();

  const canProceed =
    tourData.title.trim().length > 0 &&
    tourData.description.trim().length > 0 &&
    tourData.category.length > 0 &&
    tourData.country.trim().length > 0 &&
    tourData.countryCode.trim().length > 0 &&
    tourData.city.trim().length > 0 &&
    Number.isFinite(tourData.cityLatitude) &&
    Number.isFinite(tourData.cityLongitude);

  const handleNext = () => {
    router.push('/tour-locations');
  };

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <CreationHeader title={t('creation.details.title')} />
      <StepIndicator steps={STEPS} currentStepIndex={0} />
      <TourDetailsStep tourData={tourData} onUpdate={updateTourData} />
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
