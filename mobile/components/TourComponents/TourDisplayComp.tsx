import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TourDisplayProps } from './TourDisplayComp.config';
import { tourDisplayCompStyles } from './TourDisplayComp.styles';

import { STAR } from '@/constants/Symbols';
import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';
import { useMemo } from 'react';
import { router } from 'expo-router';

export default function TourDisplayComp({
  id,
  image,
  title,
  author,
  duration,
  length,
  reviewCount,
  rating,
}: TourDisplayProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDisplayCompStyles(theme), [theme]);
  const color = Colors[theme];

  const handlePress = () => {
    router.push({
      pathname: '/tour/[id]',
      params: { id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: image }} style={styles.image} />

        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>
            <Text style={styles.star}>{STAR}</Text> {rating}
          </Text>
        </View>

        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={12} color={color.white} />
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </View>

          <View style={styles.authorRow}>
            <Ionicons
              name="person-circle-outline"
              size={14}
              color={color.icon}
              style={styles.authorIcon}
            />
            <Text style={styles.author} numberOfLines={1}>
              {author}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="walk-outline" size={12} color={color.icon} style={styles.metaIcon} />
            <Text style={styles.metaText}>{length}</Text>
          </View>
          <Text style={styles.metaDot}>•</Text>
          <View style={styles.metaItem}>
            <Ionicons
              name="chatbubble-outline"
              size={11}
              color={color.icon}
              style={styles.metaIcon}
            />
            <Text style={styles.metaText}>{reviewCount}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
