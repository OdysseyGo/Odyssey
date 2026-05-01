import React from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  createTour,
  createTourStep,
  deleteTour,
  deleteTourStep,
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
import type { TourLocation } from '@/components/TourCreation/TourCreation.types';
import { TourReviewStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/APIClient';
import { setProfileNeedsRefresh } from '@/lib/profileRefresh';

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
  const { tourData, resetTourData, editingTourId, originalStepIds } = useTourCreation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showUnderReviewNotice, setShowUnderReviewNotice] = React.useState(false);
  const { t } = useTranslation();
  const isEditing = editingTourId !== null;
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

  const savePuzzleForStep = async (tourId: number, stepId: number, loc: TourLocation) => {
    if (!loc.puzzle) {
      return;
    }

    const basePayload = {
      question: loc.puzzle.question,
      hint: loc.puzzle.hint,
    };

    if (loc.puzzle.puzzle_type === 'TRIVIA') {
      await setStepTriviaPuzzle(tourId, stepId, {
        ...basePayload,
        options: loc.puzzle.options,
        correct_answer: loc.puzzle.correctAnswer,
      });
      return;
    }

    if (loc.puzzle.puzzle_type === 'OPEN_ENDED') {
      await setStepOpenEndedPuzzle(tourId, stepId, {
        ...basePayload,
        correct_answer: loc.puzzle.correctAnswer,
      });
      return;
    }

    if (loc.puzzle.puzzle_type === 'PICTURE_COMPARE') {
      if (!loc.puzzle.referenceImage || !loc.puzzle.referenceImage.startsWith('file://')) {
        throw new Error('PICTURE_COMPARE puzzles require a local reference image.');
      }

      await setStepPictureComparePuzzle(tourId, stepId, {
        ...basePayload,
        referenceImageUri: loc.puzzle.referenceImage,
      });
      return;
    }

    if (loc.puzzle.puzzle_type === 'AR') {
      if (!loc.puzzle.arConfig) {
        throw new Error('AR puzzles require a selected model, code, and anchor.');
      }

      await setStepArPuzzle(tourId, stepId, {
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
      return;
    }

    if (loc.puzzle.puzzle_type === 'COMPASS') {
      if (
        typeof loc.puzzle.targetHeadingDegrees !== 'number' ||
        !Number.isInteger(loc.puzzle.targetHeadingDegrees)
      ) {
        throw new Error('COMPASS puzzles require a valid integer target heading.');
      }

      await setStepCompassPuzzle(tourId, stepId, {
        ...basePayload,
        target_heading_degrees: ((loc.puzzle.targetHeadingDegrees % 360) + 360) % 360,
      });
    }
  };

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

    const submitTitle = isEditing
      ? t('creation.updateTitle', { defaultValue: 'Update Tour' })
      : t('creation.submitTitle');
    const submitMessage = isEditing
      ? t('creation.updateMessage', { defaultValue: 'Do you want to save these changes?' })
      : t('creation.submitMessage');
    const successTitle = isEditing
      ? t('creation.updateSuccessTitle', { defaultValue: 'Tour sent for review' })
      : t('creation.successTitle');
    const successMessage = isEditing
      ? t('creation.updateSuccessMessage', {
          defaultValue: 'Your changes were saved and the tour is pending review again.',
        })
      : t('creation.successMessage');

    Alert.alert(submitTitle, submitMessage, [
      { text: t('creation.cancel'), style: 'cancel' },
      {
        text: isEditing
          ? t('creation.updateConfirm', { defaultValue: 'Update' })
          : t('creation.submitConfirm'),
        onPress: async () => {
          setIsSubmitting(true);

          let createdTourId: number | null = null;

          try {
            const tourPayload = {
              title: tourData.title || 'Untitled Tour',
              description: tourData.description || 'No description provided.',
              cover_image: tourData.coverImage,
              tour_type: tourData.tourType,
              category: tourData.category || 'General',
              difficulty: tourData.difficulty,
              duration_minutes: tourData.estimatedDuration,
              city: tourData.state,
              country: tourData.country,
              country_code: tourData.countryCode,
              city_latitude: tourData.stateLatitude,
              city_longitude: tourData.stateLongitude,
              is_premium: false,
            };

            const tourId = isEditing
              ? editingTourId
              : (await createTour(tourPayload)).id;

            if (!tourId) {
              throw new Error('Missing tour id');
            }

            if (isEditing) {
              await updateTour(tourId, tourPayload);
            }

            createdTourId = isEditing ? null : tourId;
            console.log('Tour created:', createdTourId);

            for (const [index, loc] of tourData.locations.entries()) {
              const stepPayload = {
                title: loc.title || `Stop ${index + 1}`,
                description: loc.story || '',
                latitude: Number(loc.latitude).toFixed(8),
                longitude: Number(loc.longitude).toFixed(8),
                order: loc.order,
                image: loc.image,
              };

              const savedStep =
                isEditing && loc.backendStepId
                  ? await updateTourStep(tourId, loc.backendStepId, stepPayload)
                  : await createTourStep(tourId, stepPayload);

              await savePuzzleForStep(tourId, savedStep.id, loc);
            }

            if (isEditing) {
              const currentStepIds = new Set(
                tourData.locations
                  .map((location) => location.backendStepId)
                  .filter((stepId): stepId is number => stepId !== undefined)
              );
              const stepIdsToDelete = originalStepIds.filter(
                (stepId) => !currentStepIds.has(stepId)
              );
              await Promise.all(stepIdsToDelete.map((stepId) => deleteTourStep(tourId, stepId)));
            }

            if (isEditing) {
              Alert.alert(successTitle, successMessage, [
                {
                  text: t('creation.ok'),
                  onPress: () => {
                    resetTourData();
                    setProfileNeedsRefresh();
                    router.replace('/(tabs)/profile');
                  },
                },
              ]);
            } else {
              setShowUnderReviewNotice(true);
            }
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
          isSubmitting
            ? t('creation.submitting')
            : isEditing
              ? t('creation.updateCta', { defaultValue: 'Update Tour' })
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
