import {
  View,
  Text,
  Pressable,
  Animated,
  Image,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { BottomSliderStyle } from './BottomSlider.styles';
import { useColorTheme } from '@/utils/getColorTheme';
import { useMemo, useState, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animations } from '../../constants/Animations';
import { Spacing } from '@/constants/Spacing';

const BOTTOM_SHEET_ANIMATION_DURATION = Animations.bottomSheet.animationDuration;

interface BottomSliderProps {
  isExpanded?: boolean;
}

export default function BottomSlider({ isExpanded = false }: BottomSliderProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => BottomSliderStyle(theme), [theme]);

  const { height: screenHeight } = useWindowDimensions();

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
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
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
        setIsBottomSheetExpanded(toValue === EXPANDED_TRANSLATE);
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
        }
        else if (
          bottomSheetOffset.current === EXPANDED_TRANSLATE &&
          gestureState.vy > Animations.bottomSheet.swipeVelocityThreshold
        ) {
          target = HALFWAY_TRANSLATE;
        }
        else if (bottomSheetOffset.current === HALFWAY_TRANSLATE) {
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
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
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
      <View
        style={[styles.bottomPanel, { paddingTop: 2, paddingBottom: 12 }]}
        {...bottomSheetPanResponder.panHandlers}
      >
        <Pressable
          onPress={toggleBottomSheet}
          style={{
            width: '100%',
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={isBottomSheetExpanded ? 'chevron-down' : 'chevron-up'}
            size={24}
            color="#ffffff"
          />
          <Text style={[styles.panelTitle, { marginBottom: 2 }]}>Current stage of the tour</Text>
          <Text style={styles.panelText} numberOfLines={1}>
            Stage 1 · Welcome to the city tour.
          </Text>
        </Pressable>

        <View style={{ marginTop: Spacing.xs, borderRadius: 12, overflow: 'hidden' }}>
          <Image
            source={{ uri: 'https://placehold.co/600x400' }}
            style={{ width: '100%', height: 160 }}
            resizeMode="cover"
          />
        </View>
      </View>
    </Animated.View>
  );
}
