import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  PanResponder,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useMemo, useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Animations } from '@/constants/Animations';
import getStyles from './NearbyToursSlider.styles';
import type { Tour, Difficulty, TourType } from '@/api/tours';

const ANIM_DURATION = Animations.bottomSheet.animationDuration;

function difficultyColor(difficulty: Difficulty, colors: (typeof Colors)['light']): string {
  if (difficulty === 'EASY') return colors.easy;
  if (difficulty === 'HARD') return colors.hard;
  return colors.medium;
}

function tourTypeIcon(tourType: TourType): 'book-outline' | 'puzzle' | 'book-play' {
  if (tourType === 'PUZZLE') return 'puzzle';
  if (tourType === 'HYBRID') return 'book-play';
  return 'book-outline';
}

export interface NearbyToursSliderProps {
  tours: Tour[];
  loading: boolean;
  onTourPress: (tourId: number) => void;
}

export default function NearbyToursSlider({ tours, loading, onTourPress }: NearbyToursSliderProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  // translateY model: slider is anchored at bottom, positive pushes it down
  // 0 = fully expanded (almost full screen)
  const MAX_HEIGHT = screenHeight * 0.82;
  const EXPANDED = 0;
  const HALF = MAX_HEIGHT * 0.45;
  const PEEK = MAX_HEIGHT - 96; // leave just the header visible

  const snapPoints = useMemo(() => [EXPANDED, HALF, PEEK], [EXPANDED, HALF, PEEK]);

  const translateY = useRef(new Animated.Value(PEEK)).current;
  const currentOffset = useRef(PEEK);
  const previousOffset = useRef(PEEK);

  useEffect(() => {
    // If tours show up for the first time, give a subtle nudge up to HALF so the user notices
    if (tours.length > 0 && currentOffset.current === PEEK) {
      // no auto-expand — keep at peek so the map stays in focus
    }
  }, [tours.length, PEEK]);

  const animateTo = (toValue: number) => {
    Animated.timing(translateY, {
      toValue,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        previousOffset.current = currentOffset.current;
        currentOffset.current = toValue;
      }
    });
  };

  const toggle = () => {
    const cur = currentOffset.current;
    const prev = previousOffset.current;
    if (cur === PEEK) animateTo(HALF);
    else if (cur === HALF) animateTo(prev === PEEK ? EXPANDED : PEEK);
    else animateTo(HALF);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        translateY.stopAnimation((v) => {
          currentOffset.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = currentOffset.current + g.dy;
        const clamped = Math.min(PEEK, Math.max(EXPANDED, next));
        translateY.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        const next = currentOffset.current + g.dy;
        const clamped = Math.min(PEEK, Math.max(EXPANDED, next));
        let target = snapPoints.reduce(
          (closest, p) => (Math.abs(p - clamped) < Math.abs(closest - clamped) ? p : closest),
          snapPoints[0]
        );

        const threshold = Animations.bottomSheet.swipeVelocityThreshold;
        if (currentOffset.current === PEEK && g.vy < -threshold) target = HALF;
        else if (currentOffset.current === EXPANDED && g.vy > threshold) target = HALF;
        else if (currentOffset.current === HALF) {
          if (g.vy < -threshold) target = EXPANDED;
          else if (g.vy > threshold) target = PEEK;
        }

        animateTo(target);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.container, { height: MAX_HEIGHT, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <View style={styles.sheet}>
        {/* Draggable header */}
        <View {...panResponder.panHandlers}>
          <Pressable onPress={toggle} style={styles.headerPressable}>
            <View style={styles.handleBar} />
            <View style={styles.headerRow}>
              <View style={styles.headerIconBox}>
                <MaterialCommunityIcons name="map-search" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>
                  {t('map.nearby.areaTitle', { count: tours.length })}
                </Text>
                <Text style={styles.headerSubtitle}>{t('map.nearby.areaSubtitle')}</Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color={colors.subText} />
              ) : (
                <MaterialCommunityIcons name="chevron-up" size={22} color={colors.subText} />
              )}
            </View>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* List */}
        {tours.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="map-marker-off" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('map.nearby.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('map.nearby.emptySubtitle')}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {tours.map((tour) => {
              const iconBg = difficultyColor(tour.difficulty, colors);
              return (
                <Pressable
                  key={tour.id}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => onTourPress(tour.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: iconBg + '22' }]}>
                    <MaterialCommunityIcons
                      name={tourTypeIcon(tour.tour_type)}
                      size={26}
                      color={iconBg}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {tour.title}
                    </Text>
                    <View style={styles.tagsRow}>
                      <View style={[styles.tag, { backgroundColor: iconBg }]}>
                        <Text style={[styles.tagText, styles.difficultyTagText]}>
                          {t(`tourDetail.${tour.difficulty.toLowerCase()}` as any)}
                        </Text>
                      </View>
                      <View style={styles.tag}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={11}
                          color={colors.subText}
                        />
                        <Text style={styles.tagText}>
                          {t('map.nearby.duration', { count: tour.duration_minutes })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.icon}
                    style={styles.chevron}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
}
