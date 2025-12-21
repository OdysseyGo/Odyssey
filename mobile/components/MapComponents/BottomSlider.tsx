import { View, Pressable, Animated, PanResponder, useWindowDimensions } from 'react-native';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';

import getStyles from './BottomSlider.styles';
import { BottomSliderProps } from './BottomSlider.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { Animations } from '@/constants/Animations';
import TourNavigation from '../TourStepComponents/TourNavigation';

const BOTTOM_SHEET_ANIMATION_DURATION = Animations.bottomSheet.animationDuration;

export default function BottomSlider({
  tour,
  onCurrentStepChange,
  onSolvedStepsChange,
  onEndTour,
}: BottomSliderProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const { height: screenHeight } = useWindowDimensions();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [solvedSteps, setSolvedSteps] = useState<Set<string>>(new Set());
  const [locationConfirmedSteps, setLocationConfirmedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    onCurrentStepChange?.(currentStepIndex);
  }, [currentStepIndex, onCurrentStepChange]);

  useEffect(() => {
    onSolvedStepsChange?.(solvedSteps);
  }, [solvedSteps, onSolvedStepsChange]);

  const handleNavigateNext = useCallback(() => {
    if (currentStepIndex < tour.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, tour.steps.length]);

  const handleNavigatePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleStepSolved = useCallback((stepId: string) => {
    setSolvedSteps((prev) => new Set([...prev, stepId]));
  }, []);

  const handleLocationConfirm = useCallback(
    async (stepId: string, latitude: number, longitude: number) => {
      try {
        // TODO: Make API call to backend to verify location
        // For now, just mark as confirmed locally
        setLocationConfirmedSteps((prev) => new Set([...prev, stepId]));
        console.log(`Location confirmed for step ${stepId} at:`, { latitude, longitude });
      } catch (error) {
        console.error('Failed to confirm location:', error);
        throw error;
      }
    },
    []
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

  return (
    <Animated.View
      style={[
        styles.bottomOverlay,
        {
          maxHeight: screenHeight * Animations.bottomSheet.maxScreenMultiplier,
          transform: [
            {
              translateY: bottomSheetTranslateY,
            },
          ],
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
          />
        </View>
      </View>
    </Animated.View>
  );
}
