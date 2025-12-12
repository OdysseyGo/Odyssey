import { View, Text, Image, Pressable } from 'react-native';
import { TourDisplayProps } from './TourDisplayComp.config';
import { tourDisplayCompStyles } from './TourDisplayComp.styles';

import { STAR } from '@/constants/Symbols';
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

  const handlePress = () => {
    router.push({
      pathname: '/tour/[id]',
      params: { id: 1 },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.3 }]}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: image }} style={styles.image} />

        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>
            <Text style={styles.star}>{STAR}</Text> {rating}
          </Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <Text style={styles.author}>by {author}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{duration}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{length}</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{reviewCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}
