import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { getLevelTier, getNextLevelTitle, isLegendaryLevel, LevelTier } from '@/utils/levelConfig';
import { profileHeaderCompStyles } from './ProfileHeaderComp.styles';
import { ProfileHeaderProps } from './ProfileHeaderComp.config';
import { Spacing } from '@/constants/Spacing';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTranslation } from 'react-i18next';

const WalkthroughableView = walkthroughable(View);

const HEADER_HEIGHT = 240;

const OptionalCopilot = ({ disable, text, order, name, style, children }: any) => {
  if (disable) {
    return <View style={style}>{children}</View>;
  }
  return (
    <CopilotStep text={text} order={order} name={name}>
      <WalkthroughableView style={style}>{children}</WalkthroughableView>
    </CopilotStep>
  );
};
const FRAME_SIZE = 132;
const RING_RADIUS = 62;
const RING_STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const AVATAR_SIZE = 104;

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

// ─────────────────────────────────────────────────────────
// Drifting sparkle — uses Reanimated for upward drift + fade
// ─────────────────────────────────────────────────────────

type SparkleSpec = {
  left: string;
  top: string;
  size: number;
  baseOpacity: number;
  duration: number;
  delay: number;
  drift: number;
};

const SPARKLES: SparkleSpec[] = [
  { left: '8%', top: '20%', size: 3, baseOpacity: 0.7, duration: 4200, delay: 0, drift: 14 },
  { left: '14%', top: '52%', size: 2, baseOpacity: 0.5, duration: 5600, delay: 800, drift: 18 },
  { left: '22%', top: '32%', size: 4, baseOpacity: 0.85, duration: 5000, delay: 300, drift: 22 },
  { left: '32%', top: '14%', size: 2, baseOpacity: 0.6, duration: 4800, delay: 1200, drift: 12 },
  { left: '40%', top: '62%', size: 3, baseOpacity: 0.55, duration: 5400, delay: 600, drift: 18 },
  { left: '52%', top: '24%', size: 2, baseOpacity: 0.5, duration: 4600, delay: 1500, drift: 14 },
  { left: '62%', top: '52%', size: 4, baseOpacity: 0.8, duration: 5800, delay: 200, drift: 22 },
  { left: '72%', top: '16%', size: 3, baseOpacity: 0.65, duration: 4400, delay: 1000, drift: 16 },
  { left: '82%', top: '40%', size: 2, baseOpacity: 0.55, duration: 5200, delay: 700, drift: 14 },
  { left: '88%', top: '62%', size: 3, baseOpacity: 0.75, duration: 4800, delay: 1400, drift: 20 },
  { left: '18%', top: '72%', size: 2, baseOpacity: 0.45, duration: 5000, delay: 500, drift: 12 },
  { left: '46%', top: '78%', size: 3, baseOpacity: 0.6, duration: 5600, delay: 900, drift: 16 },
  { left: '76%', top: '74%', size: 2, baseOpacity: 0.5, duration: 4800, delay: 1100, drift: 14 },
  { left: '92%', top: '24%', size: 2, baseOpacity: 0.55, duration: 5200, delay: 400, drift: 12 },
  { left: '4%', top: '38%', size: 2, baseOpacity: 0.45, duration: 4600, delay: 1300, drift: 14 },
];

function AnimatedSparkle({ spec }: { spec: SparkleSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: spec.duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      )
    );
  }, [progress, spec.duration, spec.delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, spec.baseOpacity, 0]),
    transform: [{ translateY: -progress.value * spec.drift }],
  }));

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: spec.left as any,
          top: spec.top as any,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
        },
        animatedStyle,
      ]}
    />
  );
}

function BannerSparkles({ density }: { density: number }) {
  const visible = useMemo(
    () => SPARKLES.filter((_, i) => i / SPARKLES.length < density),
    [density]
  );
  return (
    <>
      {visible.map((s, i) => (
        <AnimatedSparkle key={i} spec={s} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Avatar frame with animated XP ring + pulse-near-levelup
// ─────────────────────────────────────────────────────────

function LeveledAvatarFrame({
  avatarUrl,
  level,
  xpProgressPercent,
  tier,
  onPress,
  showCamera,
  subTextColor,
}: {
  avatarUrl?: string;
  level?: number;
  xpProgressPercent?: number;
  tier: LevelTier | null;
  onPress?: () => void;
  showCamera: boolean;
  subTextColor: string;
}) {
  const targetProgress = Math.max(0, Math.min(100, xpProgressPercent ?? 0));
  const animatedProgress = useSharedValue(0);
  const pulse = useSharedValue(0);
  const isNearLevelUp = targetProgress >= 80;
  const isLegendary = level !== undefined && isLegendaryLevel(level);

  // Animate ring fill smoothly when progress changes
  useEffect(() => {
    animatedProgress.value = withTiming(targetProgress, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, animatedProgress]);

  // Pulse the level badge when close to level-up or legendary
  useEffect(() => {
    if (isNearLevelUp || isLegendary) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: 300 });
    }
  }, [isNearLevelUp, isLegendary, pulse]);

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value / 100),
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    shadowOpacity: 0.7 + pulse.value * 0.3,
    shadowRadius: 8 + pulse.value * 6,
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View
        style={{
          width: FRAME_SIZE,
          height: FRAME_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* SVG XP progress ring */}
        {tier && (
          <Svg
            width={FRAME_SIZE}
            height={FRAME_SIZE}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Defs>
              <SvgGradient id="xpRingGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={tier.ringStart} stopOpacity="1" />
                <Stop offset="1" stopColor={tier.ringEnd} stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Circle
              cx={FRAME_SIZE / 2}
              cy={FRAME_SIZE / 2}
              r={RING_RADIUS}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <AnimatedCircle
              cx={FRAME_SIZE / 2}
              cy={FRAME_SIZE / 2}
              r={RING_RADIUS}
              stroke="url(#xpRingGrad)"
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              animatedProps={ringAnimatedProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${FRAME_SIZE / 2} ${FRAME_SIZE / 2})`}
            />
          </Svg>
        )}

        {/* Avatar */}
        <View
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            backgroundColor: 'rgba(0,0,0,0.18)',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.85)',
          }}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Ionicons name="person" size={48} color={subTextColor} />
          )}
        </View>

        {/* Level number badge (LoL-style) — bottom-center, pulsing near level-up */}
        {level !== undefined && tier && (
          <Reanimated.View
            style={[
              {
                position: 'absolute',
                bottom: -2,
                alignSelf: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: tier.glowColor,
                shadowOffset: { width: 0, height: 0 },
                elevation: 6,
              },
              badgeAnimatedStyle,
            ]}
          >
            <LinearGradient
              colors={[tier.ringStart, tier.ringEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                minWidth: 38,
                paddingHorizontal: 10,
                height: 26,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            >
              <Text
                style={{
                  color: '#1E293B',
                  fontWeight: '900',
                  fontSize: 13,
                  letterSpacing: 0.3,
                }}
              >
                {level}
              </Text>
            </LinearGradient>
          </Reanimated.View>
        )}

        {/* Camera edit badge — bottom-right */}
        {showCamera && (
          <View
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.7)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Ionicons name="camera" size={13} color="#0284C7" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────
// Main header
// ─────────────────────────────────────────────────────────

export default function ProfileHeaderComp({
  title,
  subtitle,
  avatarUrl,
  onAvatarPress,
  onSettingsPress,
  settingsAccessibilityLabel,
  onTutorialsPress,
  tutorialsAccessibilityLabel,
  scrollY,
  disableCopilot = false,
  level,
  levelTitle,
  xpProgressPercent,
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
}: ProfileHeaderProps) {
  const theme = useColorTheme();
  const styles = profileHeaderCompStyles(theme);
  const color = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const tier = level !== undefined ? getLevelTier(level) : null;
  const gradientColors: [string, string, string] = tier
    ? tier.gradient
    : [color.primary, color.primary, color.primary];

  // XP fraction inside current level (e.g., 150 / 400)
  const xpInLevel =
    currentXp !== undefined && xpForCurrentLevel !== undefined
      ? Math.max(0, currentXp - xpForCurrentLevel)
      : null;
  const xpRange =
    xpForNextLevel !== undefined && xpForCurrentLevel !== undefined
      ? Math.max(0, xpForNextLevel - xpForCurrentLevel)
      : null;
  const xpToNext =
    xpForNextLevel !== undefined && currentXp !== undefined
      ? Math.max(0, xpForNextLevel - currentXp)
      : null;
  const nextTitle = level !== undefined ? getNextLevelTitle(level) : null;
  const isMaxLevel = level !== undefined && nextTitle === null;

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
    <View style={styles.outerWrapper}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}
      >
        {tier && <BannerSparkles density={tier.sparkleDensity} />}

        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.topHighlight}
          pointerEvents="none"
        />

      {onSettingsPress ? (
        <TouchableOpacity
          onPress={onTutorialsPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={tutorialsAccessibilityLabel}
          style={[
            styles.settingsButton,
            {
              top: insets.top + Spacing.md,
              left: Spacing.lg,
            },
          ]}
        >
          <Ionicons name="help-outline" size={Spacing.xl} color={color.primary} />
        </TouchableOpacity>
      ) : null}

      <OptionalCopilot
        disable={disableCopilot}
        text={t('tutorial.profile.step7text')}
        order={7}
        name="settingsStep"
        style={[
          styles.settingsButton,
          {
            top: insets.top + Spacing.md,
            right: Spacing.lg,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onSettingsPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={settingsAccessibilityLabel}
        >
          <Ionicons name="settings-outline" size={Spacing.lg} color={color.primary} />
        </TouchableOpacity>
      </OptionalCopilot>

        <Animated.View
          style={{
            transform: [{ scale: avatarScale as any }, { translateY: avatarTranslateY as any }],
          }}
        >
          <LeveledAvatarFrame
            avatarUrl={avatarUrl}
            level={level}
            xpProgressPercent={xpProgressPercent}
            tier={tier}
            onPress={onAvatarPress}
            showCamera={!!onAvatarPress}
            subTextColor={color.subText}
          />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity as any, alignItems: 'center' }}>
          <Text style={styles.username}>{title}</Text>
          {levelTitle && <Text style={styles.tierTitle}>{levelTitle.toUpperCase()}</Text>}

          {/* XP progress text */}
          {xpInLevel !== null && xpRange !== null && !isMaxLevel && (
            <Text style={styles.xpFractionText}>
              {xpInLevel.toLocaleString()} / {xpRange.toLocaleString()} XP
            </Text>
          )}
          {xpToNext !== null && nextTitle && !isMaxLevel && (
            <Text style={styles.xpToNextText}>
              {xpToNext.toLocaleString()} XP to {nextTitle}
            </Text>
          )}
          {isMaxLevel && <Text style={styles.xpToNextText}>MAX LEVEL REACHED</Text>}

          {subtitle ? (
            <View style={styles.locationChip}>
              <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.locationText}>{subtitle}</Text>
            </View>
          ) : null}
        </Animated.View>
      </LinearGradient>

      <View style={styles.bottomCurve} pointerEvents="none">
        <View style={[styles.bottomCurveInner, { backgroundColor: color.background }]} />
      </View>
    </View>
  );
}
