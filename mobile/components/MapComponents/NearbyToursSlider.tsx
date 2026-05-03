import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Animated,
  PanResponder,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useMemo, useRef, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Animations } from '@/constants/Animations';
import { Spacing } from '@/constants/Spacing';
import { ODYSSEY_TAB_BAR_FLOATING_HEIGHT } from '@/components/Navigation/OdysseyTabBar';
import getStyles from './NearbyToursSlider.styles';
import type { InBoundsSort } from '@/api/tours';
import type { Tour, Difficulty, TourType } from '@/api/tours';

const ANIM_DURATION = 550;
const DEFAULT_COLLAPSED_VISIBLE_HEIGHT = 120;
const DIRECTIONAL_BIAS_THRESHOLD = 6;

type SnapState = 'collapsed' | 'half' | 'expanded';
type SnapMetrics = { expanded: number; half: number; collapsed: number };

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

function getNearestSnap(value: number, metrics: SnapMetrics): SnapState {
  const distExpanded = Math.abs(value - metrics.expanded);
  const distHalf = Math.abs(value - metrics.half);
  const distCollapsed = Math.abs(value - metrics.collapsed);

  if (distExpanded <= distHalf && distExpanded <= distCollapsed) return 'expanded';
  if (distHalf <= distExpanded && distHalf <= distCollapsed) return 'half';
  return 'collapsed';
}

function snapValueOf(state: SnapState, metrics: SnapMetrics): number {
  if (state === 'expanded') return metrics.expanded;
  if (state === 'half') return metrics.half;
  return metrics.collapsed;
}

function getToggleTarget(current: SnapState, direction: 'up' | 'down'): SnapState {
  if (direction === 'up') {
    if (current === 'collapsed') return 'half';
    if (current === 'half') return 'expanded';
    return 'half';
  }
  if (current === 'expanded') return 'half';
  if (current === 'half') return 'collapsed';
  return 'half';
}

export interface NearbyToursSliderProps {
  tours: Tour[];
  loading: boolean;
  onTourPress: (tourId: number) => void;
  onTourView: (tourId: number) => void;
  mapVisibleTourIds: number[];
  sortBy: InBoundsSort;
  onSortChange: (sort: InBoundsSort) => void;
  hidden?: boolean;
}

export default function NearbyToursSlider({
  tours,
  loading,
  onTourPress,
  onTourView,
  mapVisibleTourIds,
  sortBy,
  onSortChange,
  hidden = false,
}: NearbyToursSliderProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const tabBarTotal = ODYSSEY_TAB_BAR_FLOATING_HEIGHT + Math.max(insets.bottom, Spacing.sm);

  const [collapsedVisibleHeight, setCollapsedVisibleHeight] = useState(
    DEFAULT_COLLAPSED_VISIBLE_HEIGHT
  );
  const [isSnapLayoutReady, setIsSnapLayoutReady] = useState(false);

  const hasMeasuredCollapsedHeightRef = useRef(false);
  const isSnapLayoutReadyRef = useRef(false);

  const maxHeight = screenHeight * 0.82;
  const metrics = useMemo<SnapMetrics>(() => {
    const expanded = 0;
    const collapsed = Math.ceil(Math.max(0, maxHeight - collapsedVisibleHeight));
    const half = Math.round((expanded + collapsed) / 2);
    return { expanded, half, collapsed };
  }, [collapsedVisibleHeight, maxHeight]);

  const metricsRef = useRef<SnapMetrics>(metrics);
  const translateY = useRef(new Animated.Value(metrics.collapsed)).current;
  const hideTranslateY = useRef(new Animated.Value(0)).current;

  const currentOffsetRef = useRef(metrics.collapsed);
  const currentSnapRef = useRef<SnapState>('collapsed');
  const dragStartOffsetRef = useRef(metrics.collapsed);
  const toggleDirectionRef = useRef<'up' | 'down'>('up');
  const blockNextPressRef = useRef(false);
  const panMovedRef = useRef(false);

  const mapVisibleTourIdSet = useMemo(() => new Set(mapVisibleTourIds), [mapVisibleTourIds]);
  const sortOptions: { key: InBoundsSort; label: string }[] = useMemo(
    () => [
      { key: 'rating', label: t('map.nearby.sort.rating', { defaultValue: 'Top rated' }) },
      { key: 'reviews', label: t('map.nearby.sort.reviews', { defaultValue: 'Most reviewed' }) },
      { key: 'name', label: t('map.nearby.sort.name', { defaultValue: 'Name' }) },
      { key: 'newest', label: t('map.nearby.sort.newest', { defaultValue: 'Newest' }) },
    ],
    [t]
  );

  const renderSortRow = () => (
    <View style={styles.sortRow}>
      {sortOptions.map((option) => {
        const active = sortBy === option.key;
        return (
          <Pressable
            key={option.key}
            style={[
              styles.sortChip,
              active && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => onSortChange(option.key)}
          >
            <Text style={[styles.sortChipText, active && { color: colors.background }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    isSnapLayoutReadyRef.current = isSnapLayoutReady;
  }, [isSnapLayoutReady]);

  useEffect(() => {
    if (!hasMeasuredCollapsedHeightRef.current) return;
    setIsSnapLayoutReady(true);
  }, [collapsedVisibleHeight]);

  useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      const live = metricsRef.current;
      currentOffsetRef.current = Math.min(live.collapsed, Math.max(live.expanded, value));
    });
    return () => translateY.removeListener(listenerId);
  }, [translateY]);

  useEffect(() => {
    if (hidden) {
      Animated.timing(hideTranslateY, {
        toValue: maxHeight + 24,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
      return;
    }

    hideTranslateY.stopAnimation(() => {
      hideTranslateY.setValue(0);
    });
  }, [hidden, hideTranslateY, maxHeight]);

  useEffect(() => {
    translateY.stopAnimation((value) => {
      const live = metricsRef.current;
      const clamped = Math.min(live.collapsed, Math.max(live.expanded, value));
      const nearest = getNearestSnap(clamped, live);
      const snapped = snapValueOf(nearest, live);
      translateY.setValue(snapped);
      currentOffsetRef.current = snapped;
      currentSnapRef.current = nearest;
      dragStartOffsetRef.current = snapped;
    });
  }, [metrics, translateY]);

  const animateToSnap = (target: SnapState) => {
    const live = metricsRef.current;
    const toValue = snapValueOf(target, live);
    const fromSnap = currentSnapRef.current;

    Animated.timing(translateY, {
      toValue,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;

      const latest = metricsRef.current;
      const settled = snapValueOf(target, latest);
      translateY.setValue(settled);
      currentOffsetRef.current = settled;
      currentSnapRef.current = target;
      dragStartOffsetRef.current = settled;

      if (target === 'expanded') toggleDirectionRef.current = 'down';
      if (target === 'collapsed') toggleDirectionRef.current = 'up';
      if (target === 'half') {
        if (fromSnap === 'collapsed') toggleDirectionRef.current = 'up';
        if (fromSnap === 'expanded') toggleDirectionRef.current = 'down';
      }
    });
  };

  const toggle = () => {
    if (!isSnapLayoutReadyRef.current) return;
    if (blockNextPressRef.current) {
      blockNextPressRef.current = false;
      return;
    }

    translateY.stopAnimation();

    const live = metricsRef.current;
    const clamped = Math.min(live.collapsed, Math.max(live.expanded, currentOffsetRef.current));
    translateY.setValue(clamped);
    currentOffsetRef.current = clamped;

    const currentSnap = getNearestSnap(clamped, live);
    currentSnapRef.current = currentSnap;
    const target = getToggleTarget(currentSnap, toggleDirectionRef.current);
    animateToSnap(target);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => isSnapLayoutReadyRef.current && Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        panMovedRef.current = false;
        translateY.stopAnimation((v) => {
          const live = metricsRef.current;
          const clamped = Math.min(live.collapsed, Math.max(live.expanded, v));
          dragStartOffsetRef.current = clamped;
          currentOffsetRef.current = clamped;
          translateY.setValue(clamped);
        });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dy) > 4) panMovedRef.current = true;
        const live = metricsRef.current;
        const next = dragStartOffsetRef.current + g.dy;
        const clamped = Math.min(live.collapsed, Math.max(live.expanded, next));
        translateY.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        if (panMovedRef.current) blockNextPressRef.current = true;

        const live = metricsRef.current;
        const next = dragStartOffsetRef.current + g.dy;
        const clamped = Math.min(live.collapsed, Math.max(live.expanded, next));
        const threshold = Animations.bottomSheet.swipeVelocityThreshold;

        let target: SnapState;
        if (g.vy > threshold) {
          target = 'collapsed';
        } else if (g.vy < -threshold) {
          target = 'expanded';
        } else {
          const nearest = getNearestSnap(clamped, live);
          if (nearest === 'half' && g.dy > DIRECTIONAL_BIAS_THRESHOLD) target = 'collapsed';
          else if (nearest === 'half' && g.dy < -DIRECTIONAL_BIAS_THRESHOLD) target = 'expanded';
          else target = nearest;
        }

        animateToSnap(target);
      },
      onPanResponderTerminate: () => {
        if (panMovedRef.current) blockNextPressRef.current = true;
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: maxHeight,
          bottom: tabBarTotal,
          transform: [{ translateY: Animated.add(translateY, hideTranslateY) }],
        },
      ]}
      pointerEvents={hidden ? 'none' : 'box-none'}
    >
      <View style={styles.sheetShadow}>
        <View style={styles.bottomPanel}>
          <View
            onLayout={(event) => {
              if (hasMeasuredCollapsedHeightRef.current) return;
              const measuredHeight = Math.ceil(event.nativeEvent.layout.height);
              if (measuredHeight <= 0) return;
              hasMeasuredCollapsedHeightRef.current = true;
              setCollapsedVisibleHeight(measuredHeight);
            }}
          >
            <View {...panResponder.panHandlers}>
              <Pressable onPress={toggle} style={styles.grabberPressable}>
                <View style={styles.handleBar} />
                <View style={styles.sheetHeaderContent}>
                  <View style={styles.headerIconBox}>
                    <MaterialCommunityIcons name="map-search" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetEyebrow}>{t('map.nearby.areaSubtitle')}</Text>
                    <Text style={styles.sheetTitle}>
                      {t('map.nearby.areaTitle', { count: tours.length })}
                    </Text>
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
          </View>

          {tours.length === 0 && !loading ? (
            <>
              {renderSortRow()}
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <MaterialCommunityIcons name="map-marker-off" size={30} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('map.nearby.emptyTitle')}</Text>
                <Text style={styles.emptySubtitle}>{t('map.nearby.emptySubtitle')}</Text>
              </View>
            </>
          ) : (
            <FlatList
              style={styles.list}
              contentContainerStyle={{ paddingBottom: 32, paddingTop: 2 }}
              showsVerticalScrollIndicator={false}
              data={tours}
              keyExtractor={(item) => String(item.id)}
              initialNumToRender={12}
              maxToRenderPerBatch={14}
              windowSize={9}
              removeClippedSubviews
              ListHeaderComponent={renderSortRow}
              renderItem={({ item: tour }) => {
                const iconBg = difficultyColor(tour.difficulty, colors);
                const isVisibleOnMap = mapVisibleTourIdSet.has(tour.id);
                const ratingLabel = `${(tour.average_rating ?? 0).toFixed(1)}/5`;
                return (
                  <Pressable
                    key={tour.id}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => (isVisibleOnMap ? onTourPress(tour.id) : onTourView(tour.id))}
                  >
                    {tour.cover_image ? (
                      <Image source={{ uri: tour.cover_image }} style={styles.cardThumbnail} />
                    ) : (
                      <View style={[styles.iconBox, { backgroundColor: iconBg + '22' }]}>
                        <MaterialCommunityIcons
                          name={tourTypeIcon(tour.tour_type)}
                          size={24}
                          color={iconBg}
                        />
                      </View>
                    )}
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
                            name="star-outline"
                            size={11}
                            color={colors.star}
                          />
                          <Text style={styles.tagText}>{ratingLabel}</Text>
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
                        {!isVisibleOnMap && (
                          <View style={styles.notOnMapTag}>
                            <MaterialCommunityIcons
                              name="map-marker-off-outline"
                              size={11}
                              color={colors.secondary}
                            />
                            <Text style={styles.notOnMapTagText}>
                              {t('map.nearby.notOnMap', { defaultValue: 'Not on map' })}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {!isVisibleOnMap && (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color={colors.secondary}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}
