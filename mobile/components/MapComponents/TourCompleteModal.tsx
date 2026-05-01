import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import getStyles from './TourCompleteModal.styles';
import { TourCompleteModalProps } from './TourCompleteModal.config';
import HexBadge from '@/components/ProfileComponents/HexBadge';
import { getBadgeTier, isCityBadge } from '@/lib/badgeVisuals';
import { BadgeTier } from '@/constants/badgeTheme';

const MODAL_GRADIENTS: Record<BadgeTier, readonly [string, string, string]> = {
  gold: ['#fff3b0', '#f7c948', '#b7791f'],
  silver: ['#f5f7fa', '#c0cad6', '#5f6f83'],
  bronze: ['#ffe1c2', '#e68a3f', '#8a3f16'],
  xp1: ['#eaf2ff', '#93c5fd', '#2563eb'],
  xp2: ['#e8fff0', '#86efac', '#16a34a'],
  xp3: ['#f2edff', '#c4b5fd', '#7c3aed'],
  neutral: ['#f8fafc', '#e2e8f0', '#94a3b8'],
};

const MODAL_GRADIENTS_DARK: Record<BadgeTier, readonly [string, string, string]> = {
  gold: ['#fffbe0', '#ffe066', '#ffb703'],
  silver: ['#ffffff', '#edf2f7', '#b8c6d6'],
  bronze: ['#fff1e2', '#ffb36b', '#e76f2d'],
  xp1: ['#edf5ff', '#8fc2ff', '#3b82f6'],
  xp2: ['#ebfff3', '#87efb0', '#22c55e'],
  xp3: ['#f5f0ff', '#c6a8ff', '#8b5cf6'],
  neutral: ['#f8fafc', '#e2e8f0', '#9fb0c4'],
};

export default function TourCompleteModal({
  visible,
  tour,
  earnedXP,
  awardedBadges = [],
  completedSteps,
  totalSteps,
  onClose,
}: TourCompleteModalProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

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

  const safeCompletedSteps = Math.max(0, Math.min(completedSteps, totalSteps));
  const completionRate = totalSteps > 0 ? Math.round((safeCompletedSteps / totalSteps) * 100) : 0;
  const earnedCityBadge =
    awardedBadges.find((item) => isCityBadge(item.badge.code)) ?? awardedBadges[0] ?? null;
  const earnedBadgeTier = earnedCityBadge ? getBadgeTier(earnedCityBadge.badge.code) : null;
  const modalGradientColors = (theme === 'dark' ? MODAL_GRADIENTS_DARK : MODAL_GRADIENTS)[
    earnedBadgeTier ?? 'neutral'
  ];

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
          <LinearGradient
            colors={modalGradientColors}
            locations={[0, 0.52, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.modalGradient}
          />
          <View style={[styles.modalTint, theme === 'dark' ? { opacity: 0.1 } : null]} />
          {!earnedCityBadge ? (
            <Animated.View style={[styles.trophyContainer, { transform: [{ rotate }] }]}>
              <MaterialCommunityIcons name="trophy" size={50} color="#000" />
            </Animated.View>
          ) : null}

          {/* Title */}
          <Text style={styles.title}>{t('map.tourComplete.title')}</Text>
          <Text style={styles.subtitle}>
            {t('map.tourComplete.subtitle', { tourName: tour.title })}
          </Text>

          {earnedCityBadge ? (
            <View style={styles.badgeShowcaseContainer}>
              <Text style={styles.badgeShowcaseLabel}>
                {t('map.tourComplete.badgeEarned', { defaultValue: 'Badge earned' })}
              </Text>
              <Animated.View style={[styles.earnedBadgeContainer, { transform: [{ rotate }] }]}>
                <HexBadge
                  code={earnedCityBadge.badge.code}
                  city={earnedCityBadge.city}
                  countryCode={earnedCityBadge.country_code}
                  fallbackLabel={earnedCityBadge.badge.name}
                  visualConfig={earnedCityBadge.visual_config as any}
                />
              </Animated.View>
            </View>
          ) : null}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{safeCompletedSteps}</Text>
              <Text style={styles.statLabel}>{t('map.tourComplete.steps')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completionRate}%</Text>
              <Text style={styles.statLabel}>{t('map.tourComplete.complete')}</Text>
            </View>
          </View>

          {/* XP Earned (only when actually awarded) */}
          {earnedXP > 0 && (
            <View style={styles.xpEarnedContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#000" />
              <Text style={styles.xpEarnedText}>
                {t('map.tourComplete.xpEarned', { xp: earnedXP })}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable style={styles.primaryButton} onPress={onClose}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>{t('map.tourComplete.done')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
