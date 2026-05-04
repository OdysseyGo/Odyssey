import React from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  createTour,
  createTourStep,
  deleteStepPuzzle,
  deleteTour,
  deleteTourStep,
  requestTourEdit,
  setStepArPuzzle,
  setStepCompassPuzzle,
  setStepOpenEndedPuzzle,
  setStepPictureComparePuzzle,
  setStepTriviaPuzzle,
  updateTour,
  updateTourStep,
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

function normalizeForChangeDetection(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForChangeDetection(item));
  }
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    const normalizedEntries = Object.entries(objectValue)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, normalizeForChangeDetection(v)] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(normalizedEntries);
  }
  if (typeof value === 'string') return value.trim();
  return value;
}

async function withRetry<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
  let attempt = 0;
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
  tasks: (() => Promise<void>)[],
  concurrency: number
): Promise<void> {
  let nextIndex = 0;
  let firstError: unknown = null;

  const worker = async () => {
    while (nextIndex < tasks.length && !firstError) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      try {
        await tasks[currentIndex]();
      } catch (error) {
        firstError = error;
      }
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, tasks.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (firstError) {
    throw firstError;
  }
}

export default function TourReviewScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, mode, originalSnapshot, resetTourData } = useTourCreation();
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
    (mode === 'edit' ||
      (Number.isFinite(tourData.stateLatitude) && Number.isFinite(tourData.stateLongitude)));

  const isEditMode = mode === 'edit' && !!tourData.sourceTourId;
  const shouldRequestEditTransition = isEditMode && tourData.sourceTourStatus === 'PUBLISHED';
  const hasMeaningfulChanges = React.useMemo(() => {
    if (!isEditMode || !originalSnapshot) return true;
    const currentNormalized = JSON.stringify(normalizeForChangeDetection(tourData));
    const originalNormalized = JSON.stringify(normalizeForChangeDetection(originalSnapshot));
    return currentNormalized !== originalNormalized;
  }, [isEditMode, originalSnapshot, tourData]);

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

    if (isEditMode && !hasMeaningfulChanges) {
      Alert.alert(
        t('creation.noChangesTitle', { defaultValue: 'No changes detected' }),
        t('creation.noChangesMessage', {
          defaultValue: 'Make at least one change before confirming your edit request.',
        })
      );
      return;
    }

    Alert.alert(
      isEditMode
        ? t('creation.editSubmitTitle', { defaultValue: 'Submit edit request' })
        : t('creation.submitTitle'),
      isEditMode
        ? t('creation.editSubmitMessage', {
            defaultValue: 'Your tour will be moved to pending review for approval.',
          })
        : t('creation.submitMessage'),
      [
        { text: t('creation.cancel'), style: 'cancel' },
        {
          text: isEditMode
            ? t('creation.confirmEdit', { defaultValue: 'Confirm Edit' })
            : t('creation.submitConfirm'),
          onPress: async () => {
            setIsSubmitting(true);
            setSubmitProgress({ completed: 0, total: tourData.locations.length });

            let createdTourId: number | null = null;

            try {
              let submittingTourId: number;
              if (isEditMode && tourData.sourceTourId) {
                submittingTourId = tourData.sourceTourId;
                if (shouldRequestEditTransition) {
                  await requestTourEdit(submittingTourId);
                }
                await updateTour(submittingTourId, {
                  title: sanitizeSingleLineText(tourData.title).trim() || 'Untitled Tour',
                  description:
                    sanitizeMultiLineText(tourData.description).trim() ||
                    'No description provided.',
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
                });
              } else {
                const tour = await createTour({
                  title: sanitizeSingleLineText(tourData.title).trim() || 'Untitled Tour',
                  description:
                    sanitizeMultiLineText(tourData.description).trim() ||
                    'No description provided.',
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
                submittingTourId = tour.id;
              }

              const syncOneLocation = async (
                loc: (typeof tourData.locations)[number],
                index: number
              ): Promise<void> => {
                const baseStepPayload = {
                  title: sanitizeSingleLineText(loc.title).trim() || `Stop ${index + 1}`,
                  description: sanitizeMultiLineText(loc.story),
                  latitude: Number(loc.latitude).toFixed(8),
                  longitude: Number(loc.longitude).toFixed(8),
                  order: loc.order,
                  image: loc.image,
                };

                const step = loc.serverStepId
                  ? await withRetry(
                      () =>
                        updateTourStep(
                          submittingTourId,
                          loc.serverStepId as number,
                          baseStepPayload
                        ),
                      STEP_UPLOAD_MAX_RETRIES
                    )
                  : await withRetry(
                      () => createTourStep(submittingTourId, baseStepPayload),
                      STEP_UPLOAD_MAX_RETRIES
                    );

                if (!loc.puzzle) {
                  await withRetry(
                    () => deleteStepPuzzle(submittingTourId, step.id),
                    STEP_UPLOAD_MAX_RETRIES
                  );
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
                      setStepTriviaPuzzle(submittingTourId, step.id, {
                        ...basePayload,
                        options: puzzle.options.map((opt) => sanitizeSingleLineText(opt)),
                        correct_answer: sanitizeSingleLineText(puzzle.correctAnswer),
                      }),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                } else if (puzzle.puzzle_type === 'OPEN_ENDED') {
                  await withRetry(
                    () =>
                      setStepOpenEndedPuzzle(submittingTourId, step.id, {
                        ...basePayload,
                        correct_answer: sanitizeSingleLineText(puzzle.correctAnswer),
                      }),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                } else if (puzzle.puzzle_type === 'PICTURE_COMPARE') {
                  await withRetry(
                    () =>
                      setStepPictureComparePuzzle(submittingTourId, step.id, {
                        ...basePayload,
                        referenceImageUri: puzzle.referenceImage,
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
                      setStepArPuzzle(submittingTourId, step.id, {
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
                      setStepCompassPuzzle(submittingTourId, step.id, {
                        ...basePayload,
                        target_heading_degrees: ((targetHeadingDegrees % 360) + 360) % 360,
                      }),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                }
              };

              const stepTasks = tourData.locations.map((loc, index) => async () => {
                await syncOneLocation(loc, index);
                setSubmitProgress((prev) => {
                  if (!prev) return prev;
                  return { ...prev, completed: Math.min(prev.total, prev.completed + 1) };
                });
              });
              await runWithConcurrency(stepTasks, STEP_UPLOAD_CONCURRENCY);

              if (isEditMode && originalSnapshot) {
                const keptIds = new Set(
                  tourData.locations
                    .map((location) => location.serverStepId)
                    .filter((stepId): stepId is number => typeof stepId === 'number')
                );
                const removedStepIds = originalSnapshot.locations
                  .map((location) => location.serverStepId)
                  .filter(
                    (stepId): stepId is number => typeof stepId === 'number' && !keptIds.has(stepId)
                  );
                for (const removedStepId of removedStepIds) {
                  await withRetry(
                    () => deleteTourStep(submittingTourId, removedStepId),
                    STEP_UPLOAD_MAX_RETRIES
                  );
                }
              }

              await updateTour(submittingTourId, {
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
      ]
    );
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
              : isEditMode
                ? t('creation.confirmEdit', { defaultValue: 'Confirm Edit' })
                : t('creation.submit')
        }
        onPress={handleSubmitTour}
        disabled={
          isSubmitting ||
          !isReadyToSubmit ||
          !hasValidSelectedLocation ||
          (isEditMode && !hasMeaningfulChanges)
        }
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
