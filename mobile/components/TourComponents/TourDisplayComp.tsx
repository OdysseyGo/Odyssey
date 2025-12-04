import { View, Text, Image, Pressable } from 'react-native';
import { TourDisplayProps } from './TourDisplayComp.config';
import { getStyles } from './TourDisplayComp.styles';

import { STAR } from '@/constants/Symbols';
import { useColorTheme } from '@/utils/useColorTheme';
import { useMemo } from 'react';

export default function TourDisplayComp({
  image,
  title,
  author,
  duration,
  length,
  reviewCount,
  rating,
}: TourDisplayProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <Pressable
      onPress={() => {}}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.3 }]}
    >
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.infoContainer}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.rating}>
            {STAR}
            {rating}/5
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
