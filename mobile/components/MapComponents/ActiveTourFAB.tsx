import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import getStyles from './ActiveTourFAB.styles';
import { ActiveTourFABProps } from './ActiveTourFAB.config';

export default function ActiveTourFAB({
  tourTitle,
  currentStep,
  totalSteps,
  onPress,
}: ActiveTourFABProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];

  // Pulse animation for the indicator dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Truncate tour title if too long
  const displayTitle = tourTitle.length > 20 
    ? tourTitle.substring(0, 18) + '...' 
    : tourTitle;

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.button} 
        onPress={onPress}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={18}
            color={colors.white}
          />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.subtitle}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>

        {/* Chevron */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.white}
          style={styles.chevron}
        />

        {/* Pulse indicator */}
        <Animated.View 
          style={[
            styles.pulseCircle,
            { transform: [{ scale: pulseAnim }] }
          ]} 
        />
      </Pressable>
    </View>
  );
}
