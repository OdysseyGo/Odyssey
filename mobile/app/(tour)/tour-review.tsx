import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  createTour,
  createTourStep,
  setStepArPuzzle,
  setStepCompassPuzzle,
  setStepGyroscopePuzzle,
  setStepPictureComparePuzzle,
  setStepTriviaPuzzle,
  updateTour,
} from '@/api/tours';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { doesLocationMeetTourRequirements } from '@/components/TourCreation';
import { TourReviewStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/APIClient';

const STEPS = ['details', 'locations', 'stories', 'review'];

function getSubmitErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallbackMessage;
}

export default function TourReviewScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, resetTourData } = useTourCreation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { t } = useTranslation();
  const isReadyToSubmit =
    !!tourData.coverImage &&
    tourData.locations.every((location) =>
      doesLocationMeetTourRequirements(location, tourData.tourType)
    );

  const handleSubmitTour = async () => {
    if (!isReadyToSubmit) {
      Alert.alert(
        t('creation.incompletePuzzleTitle', { defaultValue: 'Complete required puzzles' }),
        t('creation.incompletePuzzleMessage', {
          defaultValue: 'Puzzle tours need a valid puzzle at every location before submission.',
        })
      );
      return;
    }

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
              cover_image: tourData.coverImage,
              tour_type: tourData.tourType,
              category: tourData.category || 'General',
              difficulty: tourData.difficulty,
              duration_minutes: tourData.estimatedDuration,
              city: tourData.state || 'Unknown State',
              country: tourData.country || '',
              country_code: tourData.countryCode || '',
              city_latitude: tourData.stateLatitude,
              city_longitude: tourData.stateLongitude,
              status: 'DRAFT',
              is_premium: false,
            });

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
                if (!loc.puzzle.arConfig) {
                  throw new Error('AR puzzles require a selected model, code, and anchor.');
                }

                await setStepArPuzzle(tour.id, createdStep.id, {
                  ...basePayload,
                  scene_asset_url: loc.puzzle.arConfig.sceneAssetUrl,
                  metadata: {
                    version: 1,
                    model_id: loc.puzzle.arConfig.modelId,
                    anchor_id: loc.puzzle.arConfig.anchorId,
                    placement_mode: loc.puzzle.arConfig.placementMode,
                    secret_code: loc.puzzle.arConfig.secretCode,
                    model_scale_meters: loc.puzzle.arConfig.modelScaleMeters,
                    anchor_position: {
                      x: loc.puzzle.arConfig.anchorPosition.x,
                      y: loc.puzzle.arConfig.anchorPosition.y,
                      z: loc.puzzle.arConfig.anchorPosition.z,
                    },
                  },
                });
                continue;
              }

              if (loc.puzzle.puzzle_type === 'GYROSCOPE') {
                await setStepGyroscopePuzzle(tour.id, createdStep.id, basePayload);
                continue;
              }

              if (loc.puzzle.puzzle_type === 'COMPASS') {
                if (
                  typeof loc.puzzle.targetHeadingDegrees !== 'number' ||
                  !Number.isInteger(loc.puzzle.targetHeadingDegrees)
                ) {
                  throw new Error('COMPASS puzzles require a valid integer target heading.');
                }

                await setStepCompassPuzzle(tour.id, createdStep.id, {
                  ...basePayload,
                  target_heading_degrees: ((loc.puzzle.targetHeadingDegrees % 360) + 360) % 360,
                });
              }
            }

            // 3. Publish after all steps are created so backend city/step validation runs once.
            await updateTour(tour.id, {
              city: tourData.state || 'Unknown State',
              country: tourData.country || '',
              country_code: tourData.countryCode || '',
              city_latitude: tourData.stateLatitude,
              city_longitude: tourData.stateLongitude,
              status: 'PUBLISHED',
            });

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
            Alert.alert(
              t('creation.errorTitle'),
              getSubmitErrorMessage(error, t('creation.errorMessage'))
            );
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
        disabled={isSubmitting || !isReadyToSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
