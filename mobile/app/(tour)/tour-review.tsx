import React from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  createTour,
  createTourStep,
  deleteTour,
  setStepArPuzzle,
  setStepCompassPuzzle,
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
import { sanitizeMultiLineText, sanitizeSingleLineText } from '@/utils/inputSanitizers';

const STEPS = ['details', 'locations', 'stories', 'review'];
const STEP_UPLOAD_CONCURRENCY = 3;
const STEP_UPLOAD_MAX_RETRIES = 2;
const STEP_UPLOAD_RETRY_BASE_MS = 1200;

function getSubmitErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallbackMessage;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientSubmissionError(error: unknown) {
  if (error instanceof ApiError) {
    if (!error.statusCode) return true;
    return error.statusCode === 429 || error.statusCode >= 500;
  }
  if (error instanceof Error) {
    return /timeout|network|cannot reach/i.test(error.message);
  }
  return false;
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
  let attempt = 0;
  // Retry only transient errors. Non-transient errors fail fast.
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries || !isTransientSubmissionError(error)) {
        throw error;
      }
      attempt += 1;
      await sleep(STEP_UPLOAD_RETRY_BASE_MS * attempt);
    }
  }
}

async function runWithConcurrency(
  tasks: Array<() => Promise<void>>,
  concurrency: number
): Promise<void> {
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < tasks.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await tasks[currentIndex]();
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, tasks.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

export default function TourReviewScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, resetTourData } = useTourCreation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitProgress, setSubmitProgress] = React.useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [showUnderReviewNotice, setShowUnderReviewNotice] = React.useState(false);
  const { t } = useTranslation();
  const isReadyToSubmit =
    !!tourData.coverImage &&
    tourData.locations.every((location) =>
      doesLocationMeetTourRequirements(location, tourData.tourType)
    );
  const hasValidSelectedLocation =
    tourData.country.trim().length > 0 &&
    tourData.countryCode.trim().length > 0 &&
    tourData.state.trim().length > 0 &&
    Number.isFinite(tourData.stateLatitude) &&
    Number.isFinite(tourData.stateLongitude);

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
    if (!hasValidSelectedLocation) {
      Alert.alert(
        t('creation.incompleteLocationTitle', { defaultValue: 'Complete location details' }),
        t('creation.incompleteLocationMessage', {
          defaultValue: 'Please select country and state from the dropdown lists.',
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
          setSubmitProgress({ completed: 0, total: tourData.locations.length });

          let createdTourId: number | null = null;

          try {
            const tour = await createTour({
              title: sanitizeSingleLineText(tourData.title).trim() || 'Untitled Tour',
              description:
                sanitizeMultiLineText(tourData.description).trim() || 'No description provided.',
              cover_image: tourData.coverImage,
              tour_type: tourData.tourType,
              category: tourData.category || 'General',
              difficulty: tourData.difficulty,
              duration_minutes: tourData.estimatedDuration,
              city: sanitizeSingleLineText(tourData.state).trim(),
              country: sanitizeSingleLineText(tourData.country).trim(),
              country_code: sanitizeSingleLineText(tourData.countryCode).trim(),
              city_latitude: tourData.stateLatitude,
              city_longitude: tourData.stateLongitude,
              is_premium: false,
            });

            createdTourId = tour.id;
            console.log('Tour created:', createdTourId);
            const submittingTourId = createdTourId;

            const stepTasks = tourData.locations.map(
              (loc, index) => async () => {
                const createdStep = await withRetry(
                  () =>
                    createTourStep(submittingTourId, {
                      title: sanitizeSingleLineText(loc.title).trim() || `Stop ${index + 1}`,
                      description: sanitizeMultiLineText(loc.story),
                      latitude: Number(loc.latitude).toFixed(8),
                      longitude: Number(loc.longitude).toFixed(8),
                      order: loc.order,
                      image: loc.image,
                    }),
                  STEP_UPLOAD_MAX_RETRIES
                );

                if (!loc.puzzle) {
                  setSubmitProgress((prev) => {
                    if (!prev) return prev;
                    return { ...prev, completed: Math.min(prev.total, prev.completed + 1) };
                  });
                  return;
                }
                const puzzle = loc.puzzle;

                const basePayload = {
                  question: sanitizeMultiLineText(puzzle.question).trim(),
                  hint: sanitizeMultiLineText(puzzle.hint),
                };

                if (puzzle.puzzle_type === 'TRIVIA') {
                  await withRetry(
                    () =>
                      setStepTriviaPuzzle(submittingTourId, createdStep.id, {
                        ...basePayload,
                        options: puzzle.options.map((opt) => sanitizeSingleLineText(opt)),
                        correct_answer: sanitizeSingleLineText(puzzle.correctAnswer),
                      }),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                } else if (puzzle.puzzle_type === 'PICTURE_COMPARE') {
                  const referenceImageUri = puzzle.referenceImage;
                  if (!referenceImageUri || !referenceImageUri.startsWith('file://')) {
                    throw new Error('PICTURE_COMPARE puzzles require a local reference image.');
                  }

                  await withRetry(
                    () =>
                      setStepPictureComparePuzzle(submittingTourId, createdStep.id, {
                        ...basePayload,
                        referenceImageUri,
                      }),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                } else if (puzzle.puzzle_type === 'AR') {
                  const arConfig = puzzle.arConfig;
                  if (!arConfig) {
                    throw new Error('AR puzzles require a selected model, code, and anchor.');
                  }

                  await withRetry(
                    () =>
                      setStepArPuzzle(submittingTourId, createdStep.id, {
                        ...basePayload,
                        scene_asset_url: arConfig.sceneAssetUrl,
                        metadata: {
                          version: 1,
                          model_id: arConfig.modelId,
                          anchor_id: arConfig.anchorId,
                          placement_mode: arConfig.placementMode,
                          secret_code: arConfig.secretCode,
                          model_scale_meters: arConfig.modelScaleMeters,
                          anchor_position: {
                            x: arConfig.anchorPosition.x,
                            y: arConfig.anchorPosition.y,
                            z: arConfig.anchorPosition.z,
                          },
                        },
                      }),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                } else if (puzzle.puzzle_type === 'COMPASS') {
                  const targetHeadingDegrees = puzzle.targetHeadingDegrees;
                  if (
                    typeof targetHeadingDegrees !== 'number' ||
                    !Number.isInteger(targetHeadingDegrees)
                  ) {
                    throw new Error('COMPASS puzzles require a valid integer target heading.');
                  }

                  await withRetry(
                    () =>
                      setStepCompassPuzzle(submittingTourId, createdStep.id, {
                        ...basePayload,
                        target_heading_degrees: ((targetHeadingDegrees % 360) + 360) % 360,
                      }),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                }

                setSubmitProgress((prev) => {
                  if (!prev) return prev;
                  return { ...prev, completed: Math.min(prev.total, prev.completed + 1) };
                });
              }
            );

            await runWithConcurrency(stepTasks, STEP_UPLOAD_CONCURRENCY);

            // 3. Finalize tour metadata after all steps are created.
            await updateTour(tour.id, {
              city: sanitizeSingleLineText(tourData.state).trim(),
              country: sanitizeSingleLineText(tourData.country).trim(),
              country_code: sanitizeSingleLineText(tourData.countryCode).trim(),
              city_latitude: tourData.stateLatitude,
              city_longitude: tourData.stateLongitude,
            });

            setShowUnderReviewNotice(true);
          } catch (error) {
            console.error('Submit failed:', error);

            if (createdTourId) {
              try {
                console.log(`Hata oluştu! Yarım kalan tur (${createdTourId}) siliniyor...`);
                await deleteTour(createdTourId);
              } catch (deleteError) {
                console.error('Error on deleting tour', deleteError);
              }
            }

            Alert.alert(
              t('creation.errorTitle'),
              getSubmitErrorMessage(error, t('creation.errorMessage'))
            );
          } finally {
            setIsSubmitting(false);
            setSubmitProgress(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      {showUnderReviewNotice ? (
        <View style={styles.noticeContainer}>
          <View style={[styles.noticeCard, { backgroundColor: color.background }]}>
            <View style={[styles.noticeIconWrap, { backgroundColor: `${color.primary}1A` }]}>
              <Ionicons name="hourglass-outline" size={36} color={color.primary} />
            </View>
            <Text style={[styles.noticeTitle, { color: color.text }]}>
              {t('creation.underReviewTitle', { defaultValue: 'Your tour is under review' })}
            </Text>
            <Text style={[styles.noticeMessage, { color: color.subText }]}>
              {t('creation.underReviewMessage', {
                defaultValue:
                  'Thanks for submitting your tour. Our team is reviewing it now and it will be published soon.',
              })}
            </Text>
            <TouchableOpacity
              style={[styles.noticeButton, { backgroundColor: color.primary }]}
              onPress={() => {
                setShowUnderReviewNotice(false);
                resetTourData();
                router.dismissAll();
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.noticeButtonText, { color: color.white }]}>
                {t('creation.ok')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      <CreationHeader title={t('creation.review.title')} />
      <StepIndicator steps={STEPS} currentStepIndex={3} />
      <TourReviewStep tourData={tourData} />
      <CreationFooter
        buttonText={
          isSubmitting && submitProgress
            ? t('creation.uploadingProgress', {
                current: submitProgress.completed,
                total: submitProgress.total,
                defaultValue: 'Uploading step {{current}}/{{total}}',
              })
            : isSubmitting
              ? t('creation.submitting')
              : t('creation.submit')
        }
        onPress={handleSubmitTour}
        disabled={isSubmitting || !isReadyToSubmit || !hasValidSelectedLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noticeContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.36)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noticeCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  noticeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  noticeMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  noticeButton: {
    minWidth: 140,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  noticeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
