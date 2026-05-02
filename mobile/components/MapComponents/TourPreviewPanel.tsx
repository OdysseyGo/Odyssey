import { View, Text, Image, Pressable, Animated } from 'react-native';
import { useRef, useEffect, useState, useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import getStyles from './TourPreviewPanel.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Animations } from '@/constants/Animations';
import type { Tour, Difficulty, TourType } from '@/api/tours';

interface TourPreviewPanelProps {
  tour: Tour | null;
  onClose: () => void;
  onViewTour: (id: number) => void;
}

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

function tourTypeLabel(tourType: TourType): 'tour.story' | 'tour.puzzle' | 'tour.hybrid' {
  if (tourType === 'PUZZLE') return 'tour.puzzle';
  if (tourType === 'HYBRID') return 'tour.hybrid';
  return 'tour.story';
}

const PANEL_HEIGHT = 200;

export default function TourPreviewPanel({ tour, onClose, onViewTour }: TourPreviewPanelProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-(PANEL_HEIGHT + 40))).current;
  const [displayedTour, setDisplayedTour] = useState<Tour | null>(null);

  useEffect(() => {
    if (tour) {
      setDisplayedTour(tour);
      Animated.timing(translateY, {
        toValue: 0,
        duration: Animations.bottomSheet.animationDuration,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -(PANEL_HEIGHT + 40),
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setDisplayedTour(null);
      });
    }
  }, [tour, translateY]);

  if (!displayedTour) return null;

  const iconBg = difficultyColor(displayedTour.difficulty, colors);

  return (
    <Animated.View
      style={[styles.wrapper, { top: insets.top + 12, transform: [{ translateY }] }]}
      pointerEvents={tour ? 'box-none' : 'none'}
    >
      <View style={styles.shadow}>
        <View style={styles.panel}>
          {/* Top row: image + info */}
          <View style={styles.topRow}>
            {displayedTour.cover_image ? (
              <Image source={{ uri: displayedTour.cover_image }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.iconBox, { backgroundColor: iconBg + '22' }]}>
                <MaterialCommunityIcons
                  name={tourTypeIcon(displayedTour.tour_type)}
                  size={36}
                  color={iconBg}
                />
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {displayedTour.title}
              </Text>
              <Text style={styles.creator} numberOfLines={1}>
                @{displayedTour.creator.username}
              </Text>
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: iconBg }]}>
                  <Text style={[styles.tagText, styles.difficultyText]}>
                    {t(`tourDetail.${displayedTour.difficulty.toLowerCase()}` as any)}
                  </Text>
                </View>
                <View style={styles.tag}>
                  <MaterialCommunityIcons name="clock-outline" size={10} color={colors.subText} />
                  <Text style={styles.tagText}>
                    {t('map.nearby.duration', { count: displayedTour.duration_minutes })}
                  </Text>
                </View>
                {displayedTour.steps.length > 0 && (
                  <View style={styles.tag}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={10}
                      color={colors.subText}
                    />
                    <Text style={styles.tagText}>
                      {t('map.nearby.stops', { count: displayedTour.steps.length })}
                    </Text>
                  </View>
                )}
                <View style={styles.tag}>
                  <MaterialCommunityIcons
                    name={tourTypeIcon(displayedTour.tour_type)}
                    size={10}
                    color={colors.subText}
                  />
                  <Text style={styles.tagText}>{t(tourTypeLabel(displayedTour.tour_type) as any)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Close button — absolute over top-right of panel */}
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={13} color={colors.subText} />
          </Pressable>

          {/* View Tour button */}
          <Pressable
            style={[styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={() => onViewTour(displayedTour.id)}
          >
            <Text style={[styles.viewButtonText, { color: colors.background }]}>
              {t('map.nearby.viewTour')}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={13} color={colors.background} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
