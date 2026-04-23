import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  createTour,
  createTourStep,
  setStepArPuzzle,
  setStepGyroscopePuzzle,
  setStepPictureComparePuzzle,
  setStepTriviaPuzzle,
} from '@/api/tours';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourReviewStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourReviewScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, resetTourData } = useTourCreation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { t } = useTranslation();

  const handleSubmitTour = async () => {
    Alert.alert(t('creation.submitTitle'), t('creation.submitMessage'), [
      { text: t('creation.cancel'), style: 'cancel' },
      {
        text: t('creation.submitConfirm'),
        onPress: async () => {
          setIsSubmitting(true);
          try {
            const tour = await createTour({
              title: tourData.title || 'Untitled Tour',
              description: tourData.description || 'No description provided.',
              tour_type: tourData.tourType,
              category: tourData.category || 'General',
              difficulty: tourData.difficulty,
              duration_minutes: tourData.estimatedDuration,
              city: tourData.city || 'Unknown City',
              status: 'PUBLISHED',
              is_premium: false,
            });

            console.log('Tour created:', tour.id);

            // 2. Create steps and configure step puzzles using type-specific endpoints.
            for (const [index, loc] of tourData.locations.entries()) {
              const createdStep = await createTourStep(tour.id, {
                title: loc.title || `Stop ${index + 1}`,
                description: loc.story || '',
                latitude: Number(loc.latitude).toFixed(8),
                longitude: Number(loc.longitude).toFixed(8),
                order: loc.order,
                image: loc.image,
              });

              if (!loc.puzzle) {
                continue;
              }

              const basePayload = {
                question: loc.puzzle.question,
                hint: loc.puzzle.hint,
                xp_reward: loc.puzzle.xp_reward,
              };

              if (loc.puzzle.puzzle_type === 'TRIVIA') {
                await setStepTriviaPuzzle(tour.id, createdStep.id, {
                  ...basePayload,
                  options: loc.puzzle.options,
                  correct_answer: loc.puzzle.correctAnswer,
                });
                continue;
              }

              if (loc.puzzle.puzzle_type === 'PICTURE_COMPARE') {
                if (
                  !loc.puzzle.referenceImage ||
                  !loc.puzzle.referenceImage.startsWith('file://')
                ) {
                  throw new Error('PICTURE_COMPARE puzzles require a local reference image.');
                }

                await setStepPictureComparePuzzle(tour.id, createdStep.id, {
                  ...basePayload,
                  referenceImageUri: loc.puzzle.referenceImage,
                });
                continue;
              }

              if (loc.puzzle.puzzle_type === 'AR') {
                await setStepArPuzzle(tour.id, createdStep.id, basePayload);
                continue;
              }

              if (loc.puzzle.puzzle_type === 'GYROSCOPE') {
                await setStepGyroscopePuzzle(tour.id, createdStep.id, basePayload);
              }
            }

            Alert.alert(t('creation.successTitle'), t('creation.successMessage'), [
              {
                text: t('creation.ok'),
                onPress: () => {
                  resetTourData();
                  router.dismissAll();
                },
              },
            ]);
          } catch (error) {
            console.error('Failed to create tour:', error);
            Alert.alert(t('creation.errorTitle'), t('creation.errorMessage'));
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <CreationHeader title={t('creation.review.title')} />
      <StepIndicator steps={STEPS} currentStepIndex={3} />
      <TourReviewStep tourData={tourData} />
      <CreationFooter
        buttonText={isSubmitting ? t('creation.submitting') : t('creation.submit')}
        onPress={handleSubmitTour}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
