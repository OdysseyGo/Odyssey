import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileTourCardStyles } from './ProfileTourCard.styles';
import { ProfileTourCardProps, STATUS_COLORS, STATUS_LABELS } from './ProfileTourCard.config';

export default function ProfileTourCard({ tour, onPress }: ProfileTourCardProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => profileTourCardStyles(theme), [theme]);
  const color = Colors[theme];

  const statusStyle = STATUS_COLORS[tour.status];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/tour/[id]',
        params: { id: tour.id.toString() },
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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {tour.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {STATUS_LABELS[tour.status]}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          {tour.city && <Text style={styles.metaText}>{tour.city}</Text>}
          {tour.city && <Text style={styles.metaText}>•</Text>}
          <Text style={styles.metaText}>{formatDuration(tour.duration_minutes)}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{tour.tour_type}</Text>
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <FontAwesome name="chevron-right" size={14} color={color.subText} />
      </View>
    </Pressable>
  );
}
