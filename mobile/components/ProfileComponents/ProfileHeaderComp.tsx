import React from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileHeaderCompStyles } from './ProfileHeaderComp.styles';
import { ProfileHeaderProps } from './ProfileHeaderComp.config';
import { Spacing } from '@/constants/Spacing';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughableView = walkthroughable(View);

const HEADER_HEIGHT = 240;

export default function ProfileHeaderComp({
  title,
  subtitle,
  avatarUrl,
  onAvatarPress,
  scrollY,
}: ProfileHeaderProps) {
  const theme = useColorTheme();
  const styles = profileHeaderCompStyles(theme);
  const color = Colors[theme];
  const insets = useSafeAreaInsets();

  const avatarScale = scrollY
    ? scrollY.interpolate({
        inputRange: [0, HEADER_HEIGHT * 0.5],
        outputRange: [1, 0.72],
        extrapolate: 'clamp',
      })
    : 1;

  const avatarTranslateY = scrollY
    ? scrollY.interpolate({
        inputRange: [0, HEADER_HEIGHT],
        outputRange: [0, -(HEADER_HEIGHT * 0.35)],
        extrapolate: 'clamp',
      })
    : 0;

  const textOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, HEADER_HEIGHT * 0.4],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Subtle depth overlay at bottom of header */}
      <View style={styles.bottomGlow} />

      {/* Avatar with parallax + scale animation */}
      <Animated.View
        style={{
          transform: [{ scale: avatarScale as any }, { translateY: avatarTranslateY as any }],
        }}
      >
        <CopilotStep text="This is your avatar! Tap your avatar to change it." order={1} name="avatarStep">
          <WalkthroughableView>
            <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
              <View style={styles.avatarRing}>
                <View style={styles.avatarCircle}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={48} color={color.subText} />
                  )}
                </View>
              </View>
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={14} color={color.primary} />
              </View>
            </TouchableOpacity>
          </WalkthroughableView>
        </CopilotStep>
      </Animated.View>

      {/* Username + location fade out on scroll */}
      <Animated.View style={{ opacity: textOpacity as any, alignItems: 'center' }}>
        <Text style={styles.username}>{title}</Text>
        {subtitle ? (
          <View style={styles.locationChip}>
            <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.locationText}>{subtitle}</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
   
  );
}
