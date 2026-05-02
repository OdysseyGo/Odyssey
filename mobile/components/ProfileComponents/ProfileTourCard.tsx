import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileTourCardStyles } from './ProfileTourCard.styles';
import {
  REVIEW_STATUS_PILL_COLORS,
  ProfileTourCardProps,
  REVIEW_STATUS_PILL_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from './ProfileTourCard.config';

const TYPE_ICONS: Record<string, string> = {
  STORY: 'book-outline',
  PUZZLE: 'extension-puzzle-outline',
  HYBRID: 'layers-outline',
};

export default function ProfileTourCard({ tour, onPress, containerStyle }: ProfileTourCardProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => profileTourCardStyles(theme), [theme]);
  const color = Colors[theme];

  const statusStyle = STATUS_COLORS[tour.status];
  const pendingPillLabel =
    tour.status === 'PENDING' ? REVIEW_STATUS_PILL_LABELS[tour.review_status ?? 'IN_REVIEW'] : null;
  const pendingPillColors =
    tour.status === 'PENDING' ? REVIEW_STATUS_PILL_COLORS[tour.review_status ?? 'IN_REVIEW'] : null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/tour/[id]',
        params: {
          id: tour.id.toString(),
          ...(tour.user_has_completed_once ? { reveal: 'completed' } : {}),
        },
      });
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, containerStyle]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={(TYPE_ICONS[tour.tour_type] || 'map-outline') as any}
          size={20}
          color={color.primary}
        />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {tour.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: color.primary }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {STATUS_LABELS[tour.status]}
            </Text>
          </View>
          {pendingPillLabel && pendingPillColors ? (
            <View
              style={[
                styles.subStatusPill,
                {
                  backgroundColor: pendingPillColors.bg,
                  borderColor: pendingPillColors.border,
                },
              ]}
            >
              <Text style={[styles.subStatusText, { color: pendingPillColors.text }]}>
                {pendingPillLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          {tour.city && <Text style={styles.metaText}>{tour.city}</Text>}
          {tour.city && <Text style={styles.metaText}>&middot;</Text>}
          <Text style={styles.metaText}>{formatDuration(tour.duration_minutes)}</Text>
          <Text style={styles.metaText}>&middot;</Text>
          <Text style={styles.metaText}>{tour.tour_type}</Text>
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={16} color={color.subText} />
      </View>
    </Pressable>
  );
}
