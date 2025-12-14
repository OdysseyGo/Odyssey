import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourReviewStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter } from '@/components/TourCreation/common';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourReviewScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, resetTourData } = useTourCreation();

  const handleSubmitTour = async () => {
    Alert.alert('Submit Tour', 'Are you ready to submit your tour for review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          // TODO: Implement API call to submit tour
          Alert.alert('Success', 'Your tour has been created!', [
            {
              text: 'OK',
              onPress: () => {
                resetTourData();
                // Navigate back to the main screen
                router.dismissAll();
              },
            },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <StepIndicator steps={STEPS} currentStepIndex={3} />
      <TourReviewStep tourData={tourData} />
      <CreationFooter buttonText="Submit Tour" onPress={handleSubmitTour} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
