import { View, Text, Image, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TourDisplayProps } from './TourDisplayComp.config';
import { tourDisplayCompStyles } from './TourDisplayComp.styles';

import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';
import { useMemo, useRef } from 'react';
import { router } from 'expo-router';

export default function TourDisplayComp({
  id,
  image,
  title,
  author,
  duration,
  length,
  rating,
}: TourDisplayProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = useMemo(() => tourDisplayCompStyles(theme), [theme]);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  };

  const handlePress = () => {
    router.push({
      pathname: '/tour/[id]',
      params: { id },
    });
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Full-bleed image */}
        <Image
          source={{ uri: image || `https://picsum.photos/seed/${id}/400/600` }}
          style={styles.image}
        />

        {/* Bottom gradient for text readability */}
        <LinearGradient
          colors={['transparent', color.overlay]}
          locations={[0, 1]}
          style={styles.gradient}
        />

        {/* Duration pill — top left */}
        <View style={styles.durationPill}>
          <Ionicons name="time" size={11} color={color.white} />
          <Text style={styles.durationText}>{duration}</Text>
        </View>

        {/* Rating badge — top right */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color={color.star} />
          <Text style={styles.ratingText}>{rating || '0.0'}</Text>
        </View>

        {/* Bottom info overlay */}
        <View style={styles.infoOverlay}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} numberOfLines={1}>
              {author}
            </Text>
            <View style={styles.stepsChip}>
              <Ionicons name="footsteps" size={9} color="rgba(255,255,255,0.9)" />
              <Text style={styles.stepsText}>{length}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
