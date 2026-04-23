import { View, Pressable, Animated, PanResponder, useWindowDimensions, Alert } from 'react-native';
import { useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import getStyles from './BottomSlider.styles';
import { BottomSliderProps } from './BottomSlider.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { Animations } from '@/constants/Animations';
import TourNavigation from '../TourStepComponents/TourNavigation';

import { useActiveTour } from '@/contexts/ActiveTourContext';
import { completeStep, skipStep } from '@/api/tourProgress'; //TODO: implement a skip button, api endpoint is ready

const BOTTOM_SHEET_ANIMATION_DURATION = Animations.bottomSheet.animationDuration;

export default function BottomSlider({
  onEndTour,
  onTourComplete,
}: BottomSliderProps & { onTourComplete?: () => Promise<void> | void }) {
  const { t } = useTranslation();
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { height: screenHeight } = useWindowDimensions();

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
  } = useActiveTour();

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

    try {
      const response = await completeStep(progressId);

      if (response.is_tour_complete) {
        await onTourComplete?.();
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
      console.error('[BottomSlider] completeStep error:', error);
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
    onTourComplete,
    t,
  ]);

  const handleSkip = useCallback(async () => {
    if (!tour || !progressId) return;

    if (currentStepIndex < highestStepIndex) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    const currentStep = tour.steps[currentStepIndex];
    if (!currentStep) {
      console.error('[BottomSlider] handleSkip — currentStep out of bounds:', currentStepIndex);
      return;
    }

    try {
      const response = await skipStep(progressId);

      if (response.is_tour_complete) {
        await onTourComplete?.();
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
    solvedSteps,
    setCurrentStepIndex,
    setHighestStepIndex,
    onTourComplete,
    t,
  ]);

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

  const MAX_SHEET_HEIGHT = screenHeight * Animations.bottomSheet.maxScreenMultiplier;
  const COLLAPSED_TRANSLATE = MAX_SHEET_HEIGHT * Animations.bottomSheet.collapsedScreenMultiplier;
  const EXPANDED_TRANSLATE = MAX_SHEET_HEIGHT * Animations.bottomSheet.expandedScreenMultiplier;
  const HALFWAY_TRANSLATE = MAX_SHEET_HEIGHT * Animations.bottomSheet.halfwayScreenMultiplier;

  const snapPoints = useMemo(
    () => [EXPANDED_TRANSLATE, HALFWAY_TRANSLATE, COLLAPSED_TRANSLATE],
    [EXPANDED_TRANSLATE, HALFWAY_TRANSLATE, COLLAPSED_TRANSLATE]
  );
  const maxTranslate = COLLAPSED_TRANSLATE;
  const minTranslate = EXPANDED_TRANSLATE;
  const bottomSheetTranslateY = useRef(new Animated.Value(COLLAPSED_TRANSLATE)).current;
  const bottomSheetOffset = useRef(COLLAPSED_TRANSLATE);
  const previousPosition = useRef(COLLAPSED_TRANSLATE);

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
    const previous = previousPosition.current;

    if (current === COLLAPSED_TRANSLATE) {
      animateBottomSheetTo(HALFWAY_TRANSLATE);
    } else if (current === HALFWAY_TRANSLATE) {
      if (previous === COLLAPSED_TRANSLATE) {
        animateBottomSheetTo(EXPANDED_TRANSLATE);
      } else {
        animateBottomSheetTo(COLLAPSED_TRANSLATE);
      }
    } else if (current === EXPANDED_TRANSLATE) {
      animateBottomSheetTo(HALFWAY_TRANSLATE);
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
          bottomSheetOffset.current === COLLAPSED_TRANSLATE &&
          gestureState.vy < -Animations.bottomSheet.swipeVelocityThreshold
        ) {
          target = HALFWAY_TRANSLATE;
        } else if (
          bottomSheetOffset.current === EXPANDED_TRANSLATE &&
          gestureState.vy > Animations.bottomSheet.swipeVelocityThreshold
        ) {
          target = HALFWAY_TRANSLATE;
        } else if (bottomSheetOffset.current === HALFWAY_TRANSLATE) {
          if (gestureState.vy < -Animations.bottomSheet.swipeVelocityThreshold) {
            target = EXPANDED_TRANSLATE;
          } else if (gestureState.vy > Animations.bottomSheet.swipeVelocityThreshold) {
            target = COLLAPSED_TRANSLATE;
          }
        }

        animateBottomSheetTo(target);
      },
    })
  ).current;

  // We are missing the return early if no tour
  if (!tour) return null;

  return (
    <Animated.View
      style={[
        styles.bottomOverlay,
        {
          maxHeight: screenHeight * Animations.bottomSheet.maxScreenMultiplier,
          transform: [{ translateY: bottomSheetTranslateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.bottomPanel}>
        <View {...bottomSheetPanResponder.panHandlers}>
          <Pressable onPress={toggleBottomSheet} style={styles.pressable}>
            <View style={styles.handleBar} />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
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
    </Animated.View>
  );
}
