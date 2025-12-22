import { View, Text, Image, Pressable, Animated } from 'react-native';
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
  reviewCount,
  rating,
}: TourDisplayProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDisplayCompStyles(theme), [theme]);
  const color = Colors[theme];

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const displayRating = typeof rating === 'number' ? 0 : '0.0';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />

          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFD93D" />
            <Text style={styles.ratingText}>{displayRating}</Text>
          </View>

          <View style={styles.durationChip}>
            <Ionicons name="time" size={14} color="#FFFFFF" />
            <Text style={styles.durationText}>{duration}</Text>
          </View>

          <View style={styles.distanceChip}>
            <Ionicons name="footsteps" size={14} color="#FFFFFF" />
            <Text style={styles.distanceText}>{length}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </View>

          {/* Author & Reviews Row */}
          <View style={styles.bottomRow}>
            <View style={styles.authorContainer}>
              <View style={styles.authorAvatar}>
                <Ionicons name="person" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.authorText} numberOfLines={1}>
                {author}
              </Text>
            </View>

            <View style={styles.reviewsContainer}>
              <Ionicons name="chatbubbles" size={14} color={color.primary} />
              <Text style={styles.reviewsText}>{reviewCount}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
