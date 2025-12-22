import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import getStyles from './TourCompleteModal.styles';
import { TourCompleteModalProps } from './TourCompleteModal.config';

export default function TourCompleteModal({
  visible,
  tour,
  earnedXP,
  completedSteps,
  totalSteps,
  onClose,
}: TourCompleteModalProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      bounceAnim.setValue(0);

      // Start entrance animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.elastic(1),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -20,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
              toValue: 0,
              friction: 3,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
            },
          ]}
        >
          {/* Trophy Icon */}
          <Animated.View style={[styles.trophyContainer, { transform: [{ rotate }] }]}>
            <MaterialCommunityIcons name="trophy" size={50} color="#000" />
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>Tour Complete!</Text>
          <Text style={styles.subtitle}>You've finished {tour.title}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedSteps}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>

          {/* XP Earned */}
          <View style={styles.xpEarnedContainer}>
            <MaterialCommunityIcons name="star" size={24} color="#000" />
            <Text style={styles.xpEarnedText}>+{earnedXP} XP Earned!</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable style={styles.primaryButton} onPress={onClose}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
