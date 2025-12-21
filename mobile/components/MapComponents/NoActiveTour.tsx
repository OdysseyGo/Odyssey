import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import getStyles from './NoActiveTour.styles';
import { NoActiveTourProps } from './NoActiveTour.config';

export default function NoActiveTour({ onBrowseTours }: NoActiveTourProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];

  // Floating animation for the icon
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  const handleBrowseTours = () => {
    if (onBrowseTours) {
      onBrowseTours();
    } else {
      // Default: navigate to tour display/search
      router.navigate('/(tabs)/tourDisplay');
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Icon */}
      <Animated.View 
        style={[
          styles.iconContainer,
          { transform: [{ translateY: floatAnim }] }
        ]}
      >
        <MaterialCommunityIcons
          name="map-marker-question"
          size={56}
          color={colors.primary}
        />
      </Animated.View>

      {/* Title */}
      <Text style={styles.title}>No Active Tour</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Start a tour to see interactive map navigation with stops, puzzles, and exciting discoveries along the way!
      </Text>

      {/* Browse Tours Button */}
      <Pressable 
        style={styles.browseButton} 
        onPress={handleBrowseTours}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
      >
        <MaterialCommunityIcons
          name="compass"
          size={20}
          color={colors.white}
        />
        <Text style={styles.browseButtonText}>Browse Tours</Text>
      </Pressable>

      {/* Hint */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          Tip: Find a tour you like and tap "Start Tour" to begin your adventure!
        </Text>
      </View>
    </View>
  );
}
