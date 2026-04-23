import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  createTour,
  createTourStep,
  deleteTourStep,
  updateTour,
  updateTourStep,
} from '@/api/tours';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourStep } from '@/api/tours';
import { TourReviewStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';
import { setProfileNeedsRefresh } from '@/utils/profileRefreshFlag';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourReviewScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, resetTourData, editingTourId, originalStepIds } = useTourCreation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { t } = useTranslation();
  const isEditing = editingTourId !== null;

  const handleSubmitTour = async () => {
    const submitTitle = isEditing
      ? t('creation.updateTitle', { defaultValue: 'Update Tour' })
      : t('creation.submitTitle');
    const submitMessage = isEditing
      ? t('creation.updateMessage', { defaultValue: 'Do you want to save these changes?' })
      : t('creation.submitMessage');
    const successTitle = isEditing
      ? t('creation.updateSuccessTitle', { defaultValue: 'Tour updated!' })
      : t('creation.successTitle');
    const successMessage = isEditing
      ? t('creation.updateSuccessMessage', { defaultValue: 'Your tour has been updated.' })
      : t('creation.successMessage');

    Alert.alert(submitTitle, submitMessage, [
      { text: t('creation.cancel'), style: 'cancel' },
      {
        text: isEditing
          ? t('creation.updateConfirm', { defaultValue: 'Update' })
          : t('creation.submitConfirm'),
        onPress: async () => {
          setIsSubmitting(true);
          try {
            const tourPayload = {
              title: tourData.title || 'Untitled Tour',
              description: tourData.description || 'No description provided.',
              tour_type: tourData.tourType,
              category: tourData.category || 'General',
              difficulty: tourData.difficulty,
              duration_minutes: tourData.estimatedDuration,
              city: tourData.city || 'Unknown City',
            };

            const tourId = isEditing
              ? editingTourId
              : (
                  await createTour({
                    ...tourPayload,
                    status: 'PUBLISHED',
                    is_premium: false,
                  })
                ).id;

            if (!tourId) {
              throw new Error('Missing tour id');
            }

            if (isEditing) {
              await updateTour(tourId, tourPayload);
            }

            const saveStepPromises = tourData.locations.map((loc, index) => {
              const stepPayload: Partial<TourStep> = {
                title: loc.title || `Stop ${index + 1}`,
                description: loc.story || '',
                latitude: Number(loc.latitude).toFixed(8),
                longitude: Number(loc.longitude).toFixed(8),
                order: loc.order,
                image: loc.image,
                puzzle: loc.puzzle
                  ? {
                      puzzle_type: loc.puzzle.puzzle_type,
                      question: loc.puzzle.question,
                      options: loc.puzzle.options,
                      correct_answer: loc.puzzle.correctAnswer,
                      hint: loc.puzzle.hint,
                      xp_reward: loc.puzzle.xp_reward,
                    }
                  : undefined,
              };

              if (isEditing && loc.backendStepId) {
                return updateTourStep(tourId, loc.backendStepId, stepPayload);
              }

              return createTourStep(tourId, stepPayload);
            });

            // allSettled instead of all: without a backend transaction we can still report
            // which individual steps failed rather than silently leaving the tour half-saved.
            const stepResults = await Promise.allSettled(saveStepPromises);
            const stepFailures = stepResults.filter(
              (result): result is PromiseRejectedResult => result.status === 'rejected'
            );

            let deleteFailures: PromiseRejectedResult[] = [];
            if (isEditing) {
              const currentStepIds = new Set(
                tourData.locations
                  .map((location) => location.backendStepId)
                  .filter((stepId): stepId is number => stepId !== undefined)
              );

              const stepIdsToDelete = originalStepIds.filter(
                (stepId) => !currentStepIds.has(stepId)
              );
              const deleteResults = await Promise.allSettled(
                stepIdsToDelete.map((stepId) => deleteTourStep(tourId, stepId))
              );
              deleteFailures = deleteResults.filter(
                (result): result is PromiseRejectedResult => result.status === 'rejected'
              );
            }

            if (stepFailures.length > 0 || deleteFailures.length > 0) {
              stepFailures.forEach((f) => console.error('Step save failed:', f.reason));
              deleteFailures.forEach((f) => console.error('Step delete failed:', f.reason));
              throw new Error(
                `Partial save: ${stepFailures.length} step(s) failed to save, ${deleteFailures.length} failed to delete.`
              );
            }

            Alert.alert(successTitle, successMessage, [
              {
                text: t('creation.ok'),
                onPress: () => {
                  resetTourData();
                  if (isEditing) {
                    setProfileNeedsRefresh();
                    router.replace('/(tabs)/profile');
                    return;
                  }
                  router.dismissAll();
                },
              },
            ]);
          } catch (error) {
            console.error('Failed to save tour:', error);
            const message =
              error instanceof Error && error.message.startsWith('Partial save:')
                ? error.message
                : t('creation.errorMessage');
            Alert.alert(t('creation.errorTitle'), message);
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
        buttonText={
          isSubmitting
            ? t('creation.submitting')
            : isEditing
              ? t('creation.updateCta', { defaultValue: 'Update Tour' })
              : t('creation.submit')
        }
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
