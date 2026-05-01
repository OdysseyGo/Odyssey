import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  PanResponder,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useMemo, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import getStyles from './BottomSlider.styles';
import { BottomSliderProps } from './BottomSlider.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { Animations } from '@/constants/Animations';
import TourNavigation from '../TourStepComponents/TourNavigation';
import { Spacing } from '@/constants/Spacing';
import { ODYSSEY_TAB_BAR_FLOATING_HEIGHT } from '@/components/Navigation/OdysseyTabBar';

import { useActiveTour } from '@/contexts/ActiveTourContext';
import { completeStep, DEFAULT_MAX_FAILED_ATTEMPTS, skipStep } from '@/api/tourProgress'; //TODO: implement a skip button, api endpoint is ready
import type { UserBadge } from '@/api/profile';

const BOTTOM_SHEET_ANIMATION_DURATION = Animations.bottomSheet.animationDuration;
const COLLAPSED_VISIBLE_HEIGHT = 110;
const TAB_BAR_GAP = Spacing.md;

export default function BottomSlider({
  onEndTour,
  onTourComplete,
}: BottomSliderProps & {
  onTourComplete?: (awardedXP: number, awardedBadges?: UserBadge[]) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [isSkipConfirmVisible, setIsSkipConfirmVisible] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarTotalHeight = ODYSSEY_TAB_BAR_FLOATING_HEIGHT + Math.max(insets.bottom, Spacing.sm);
  const bottomClearance =
    Math.max(tabBarTotalHeight - Spacing.md, ODYSSEY_TAB_BAR_FLOATING_HEIGHT) + TAB_BAR_GAP;
  const expandedTop = Math.max(insets.top, screenHeight * 0.08);
  const sheetHeight = Math.max(screenHeight - expandedTop - bottomClearance, 0);

  const {
    tour,
    progressId,
    currentStepIndex,
    highestStepIndex,
    solvedSteps,
    locationConfirmedSteps,
    setCurrentStepIndex,
    setHighestStepIndex,
    solveStep,
    confirmLocation,
    recordSkip,
    stepAnswers,
    stepAttempts,
  } = useActiveTour();

  const skipCountsAsMistake = useCallback(
    (stepId: string) => {
      const currentStep = tour?.steps.find((step) => step.id === stepId);
      if (!currentStep || currentStep.type !== 'puzzle') return true;

      const failedAttemptCount = stepAttempts.get(stepId) ?? 0;
      const hasSubmittedTriviaAnswer =
        currentStep.puzzle.type === 'multiple-choice' && stepAnswers.has(stepId);

      if (currentStep.puzzle.type === 'multiple-choice') {
        return !hasSubmittedTriviaAnswer && failedAttemptCount === 0;
      }

      if (
        currentStep.puzzle.type === 'ar-code' ||
        currentStep.puzzle.type === 'picture-compare' ||
        currentStep.puzzle.type === 'open-ended'
      ) {
        return failedAttemptCount < DEFAULT_MAX_FAILED_ATTEMPTS;
      }

      return true;
    },
    [stepAnswers, stepAttempts, tour?.steps]
  );

  const handleNavigateNext = useCallback(async () => {
    if (!tour || !progressId) return;

    if (currentStepIndex < highestStepIndex) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    const currentStep = tour.steps[currentStepIndex];
    if (!currentStep) {
      console.error(
        '[BottomSlider] currentStep is undefined — index out of bounds:',
        currentStepIndex,
        'steps length:',
        tour.steps.length
      );
      return;
    }

    const stepIsSolved = solvedSteps.has(currentStep.id);
    const useSkip = currentStep.type === 'puzzle' && !stepIsSolved;

    try {
      const response = useSkip ? await skipStep(progressId) : await completeStep(progressId);
      if (useSkip) {
        recordSkip(skipCountsAsMistake(currentStep.id));
      }

      if (response.is_tour_complete) {
        await onTourComplete?.(response.awarded_xp ?? 0, response.awarded_badges);
      } else if (response.new_step_id) {
        const nextStepIndex = tour.steps.findIndex(
          (s) => s.id === response.new_step_id?.toString()
        );
        if (nextStepIndex !== -1) {
          setCurrentStepIndex(nextStepIndex);
          setHighestStepIndex(nextStepIndex);
        } else {
          console.warn(
            '[BottomSlider] new_step_id not found in frontend steps:',
            response.new_step_id
          );
        }
      }
    } catch (error) {
      console.error('[BottomSlider] completeStep/skipStep error:', error);
      Alert.alert(t('common.error'), t('common.syncError'));
    }
  }, [
    tour,
    progressId,
    currentStepIndex,
    highestStepIndex,
    solvedSteps,
    setCurrentStepIndex,
    setHighestStepIndex,
    recordSkip,
    skipCountsAsMistake,
    onTourComplete,
    t,
  ]);

  const handleConfirmSkip = useCallback(async () => {
    if (!tour || !progressId) return;

    if (currentStepIndex < highestStepIndex) {
      setIsSkipConfirmVisible(false);
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    const currentStep = tour.steps[currentStepIndex];
    if (!currentStep) {
      console.error('[BottomSlider] handleSkip — currentStep out of bounds:', currentStepIndex);
      return;
    }

    setIsSkipConfirmVisible(false);

    try {
      const response = await skipStep(progressId);

      recordSkip(skipCountsAsMistake(currentStep.id));

      if (response.is_tour_complete) {
        await onTourComplete?.(response.awarded_xp ?? 0, response.awarded_badges);
      } else if (response.new_step_id) {
        const nextStepIndex = tour.steps.findIndex(
          (s) => s.id === response.new_step_id?.toString()
        );
        if (nextStepIndex !== -1) {
          setCurrentStepIndex(nextStepIndex);
          setHighestStepIndex(nextStepIndex);
        }
      }
    } catch (error) {
      console.error('[BottomSlider] skipStep error:', error);
      Alert.alert(t('common.error'), t('common.syncError'));
    }
  }, [
    tour,
    progressId,
    currentStepIndex,
    highestStepIndex,
    setCurrentStepIndex,
    setHighestStepIndex,
    recordSkip,
    skipCountsAsMistake,
    onTourComplete,
    t,
  ]);

  const handleSkip = useCallback(() => {
    if (!tour || !progressId) return;

    if (currentStepIndex < highestStepIndex) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    setIsSkipConfirmVisible(true);
  }, [tour, progressId, currentStepIndex, highestStepIndex, setCurrentStepIndex]);

  const handleNavigatePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, setCurrentStepIndex]);

  const handleStepSolved = useCallback(
    (stepId: string) => {
      solveStep(stepId, 15);
    },
    [solveStep]
  );

  const handleLocationConfirm = useCallback(
    async (stepId: string, latitude: number, longitude: number) => {
      confirmLocation(stepId);
    },
    [confirmLocation]
  );

  // Slider is anchored to bottom. translateY moves it:
  // - positive translateY = push DOWN (more off-screen)
  // - negative translateY = pull UP (more on-screen)
  // - 0 = fully visible at bottom

  const COLLAPSED_TRANSLATE = Math.max(sheetHeight - COLLAPSED_VISIBLE_HEIGHT, 0);
  const EXPANDED_TRANSLATE = 0;

  const snapPoints = useMemo(
    () => [EXPANDED_TRANSLATE, COLLAPSED_TRANSLATE],
    [EXPANDED_TRANSLATE, COLLAPSED_TRANSLATE]
  );
  const maxTranslate = COLLAPSED_TRANSLATE;
  const minTranslate = EXPANDED_TRANSLATE;
  const bottomSheetTranslateY = useRef(new Animated.Value(COLLAPSED_TRANSLATE)).current;
  const bottomSheetOffset = useRef(COLLAPSED_TRANSLATE);
  const previousPosition = useRef(COLLAPSED_TRANSLATE);
  const sheetProgressInput = [EXPANDED_TRANSLATE, COLLAPSED_TRANSLATE];
  const handleScaleX = bottomSheetTranslateY.interpolate({
    inputRange: sheetProgressInput,
    outputRange: [1.55, 1],
    extrapolate: 'clamp',
  });
  const headerLift = bottomSheetTranslateY.interpolate({
    inputRange: sheetProgressInput,
    outputRange: [-2, 0],
    extrapolate: 'clamp',
  });

  const animateBottomSheetTo = (toValue: number) => {
    Animated.timing(bottomSheetTranslateY, {
      toValue,
      duration: BOTTOM_SHEET_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        previousPosition.current = bottomSheetOffset.current;
        bottomSheetOffset.current = toValue;
      }
    });
  };

  const toggleBottomSheet = () => {
    const current = bottomSheetOffset.current;

    if (current === COLLAPSED_TRANSLATE) {
      animateBottomSheetTo(EXPANDED_TRANSLATE);
    } else if (current === EXPANDED_TRANSLATE) {
      animateBottomSheetTo(COLLAPSED_TRANSLATE);
    } else {
      const nearestTarget =
        Math.abs(current - EXPANDED_TRANSLATE) < Math.abs(current - COLLAPSED_TRANSLATE)
          ? COLLAPSED_TRANSLATE
          : EXPANDED_TRANSLATE;
      animateBottomSheetTo(nearestTarget);
    }
  };

  const bottomSheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,

      onPanResponderGrant: () => {
        bottomSheetTranslateY.stopAnimation((value) => {
          bottomSheetOffset.current = value;
        });
      },

      onPanResponderMove: (_, gestureState) => {
        const nextY = bottomSheetOffset.current + gestureState.dy;
        const clampedY = Math.min(maxTranslate, Math.max(minTranslate, nextY));
        bottomSheetTranslateY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const nextY = bottomSheetOffset.current + gestureState.dy;
        const clampedY = Math.min(maxTranslate, Math.max(EXPANDED_TRANSLATE, nextY));

        let target = snapPoints.reduce(
          (closest, point) =>
            Math.abs(point - clampedY) < Math.abs(closest - clampedY) ? point : closest,
          snapPoints[0]
        );

        if (
          gestureState.dy < -16 ||
          gestureState.vy < -Animations.bottomSheet.swipeVelocityThreshold
        ) {
          target = EXPANDED_TRANSLATE;
        } else if (
          gestureState.dy > 16 ||
          gestureState.vy > Animations.bottomSheet.swipeVelocityThreshold
        ) {
          target = COLLAPSED_TRANSLATE;
        }

        animateBottomSheetTo(target);
      },
    })
  ).current;

  // We are missing the return early if no tour
  if (!tour) return null;

  const currentStep = tour.steps[currentStepIndex];
  const progressSegmentCount = tour.steps.length + 1;
  const currentProgressNode = currentStepIndex + 1;
  const progressPercent = (currentProgressNode / progressSegmentCount) * 100;

  return (
    <Animated.View
      style={[
        styles.bottomOverlay,
        {
          top: expandedTop,
          bottom: bottomClearance,
          maxHeight: sheetHeight,
          transform: [{ translateY: bottomSheetTranslateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.sheetShadow}>
        <View style={styles.bottomPanel}>
          <View {...bottomSheetPanResponder.panHandlers}>
            <Pressable
              onPress={toggleBottomSheet}
              style={styles.grabberPressable}
              accessibilityRole="button"
              accessibilityLabel="Adjust tour progress panel"
              accessibilityHint="Expands or collapses the tour progress sheet"
            >
              <Animated.View
                style={[styles.grabberSurface, { transform: [{ translateY: headerLift }] }]}
              >
                <Animated.View
                  style={[styles.handleBar, { transform: [{ scaleX: handleScaleX }] }]}
                />
                <View style={styles.sheetHeaderContent}>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetEyebrow}>{t('tourStep.tourProgress')}</Text>
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {currentStep?.title}
                    </Text>
                  </View>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>
                      {currentStepIndex + 1}/{tour.steps.length}
                    </Text>
                  </View>
                </View>
                <View style={styles.miniProgressTrack}>
                  <View style={[styles.miniProgressFill, { width: `${progressPercent}%` }]} />
                  {tour.steps.map((step, index) => {
                    const progressNodeIndex = index + 1;
                    return (
                      <View
                        key={`progress-node-${step.id}`}
                        style={[
                          styles.miniProgressNode,
                          progressNodeIndex <= currentProgressNode && styles.miniProgressNodeActive,
                          { left: `${(progressNodeIndex / progressSegmentCount) * 100}%` },
                        ]}
                      />
                    );
                  })}
                </View>
              </Animated.View>
            </Pressable>
          </View>

          <View style={styles.navigationContent}>
            <TourNavigation
              tour={tour}
              currentStepIndex={currentStepIndex}
              solvedSteps={solvedSteps}
              locationConfirmedSteps={locationConfirmedSteps}
              onNavigateNext={handleNavigateNext}
              onNavigatePrev={handleNavigatePrev}
              onStepSolved={handleStepSolved}
              onLocationConfirm={handleLocationConfirm}
              onEndTour={onEndTour}
              onSkipStep={handleSkip}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={isSkipConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSkipConfirmVisible(false)}
      >
        <View style={styles.skipModalOverlay}>
          <View style={styles.skipModalContainer}>
            <View style={styles.skipModalIcon}>
              <Text style={styles.skipModalIconText}>XP</Text>
            </View>

            <Text style={styles.skipModalTitle}>{t('map.activeTour.skipConfirmTitle')}</Text>
            <Text style={styles.skipModalMessage}>{t('map.activeTour.skipConfirmMessage')}</Text>

            <View style={styles.skipModalWarning}>
              <Text style={styles.skipModalWarningText}>
                {t('map.activeTour.skipBadgeReduction')}
              </Text>
            </View>

            <View style={styles.skipModalActions}>
              <Pressable
                style={styles.skipModalCancelButton}
                onPress={() => setIsSkipConfirmVisible(false)}
              >
                <Text style={styles.skipModalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.skipModalConfirmButton} onPress={handleConfirmSkip}>
                <Text style={styles.skipModalConfirmText}>
                  {t('map.activeTour.skipConfirmAction')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}
