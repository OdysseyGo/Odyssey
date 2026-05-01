import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  getUserById,
  getUserFollowings,
  getUserPublishedTours,
  followUser,
  unfollowUser,
  User,
} from '@/api/users';
import { getCurrentUser } from '@/api/auth';
import { Tour } from '@/api/tours';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { computeLevelInfo, getLevelTier } from '@/utils/levelConfig';
import { userProfileStyles } from './UserProfileScreen.styles';
import ProfileHeaderComp from './ProfileHeaderComp';
import ProfileStatsComp from './ProfileStatsComp';
import ProfileTourCard from './ProfileTourCard';

const HEADER_HEIGHT = 240;

// ─────────────────────────────────────────────────────────
// Skeleton shimmer
// ─────────────────────────────────────────────────────────

function ShimmerBlock({
  width,
  height,
  borderRadius = 12,
  style,
  color,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  color: string;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}

function SkeletonLoading({ theme }: { theme: (typeof Colors)['light'] }) {
  const shimmer = theme.foregroundSecondary;
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          backgroundColor: theme.headerGradientTop,
          alignItems: 'center',
          paddingTop: 80,
          paddingBottom: 60,
        }}
      >
        <ShimmerBlock width={112} height={112} borderRadius={56} color="rgba(255,255,255,0.2)" />
        <ShimmerBlock
          width={160}
          height={22}
          color="rgba(255,255,255,0.2)"
          style={{ marginTop: 14 }}
        />
        <ShimmerBlock
          width={100}
          height={28}
          borderRadius={999}
          color="rgba(255,255,255,0.15)"
          style={{ marginTop: 10 }}
        />
      </View>
      <View style={{ alignItems: 'center', marginTop: -Spacing.xxl }}>
        <ShimmerBlock width="88%" height={110} borderRadius={22} color={shimmer} />
      </View>
      <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, gap: Spacing.lg }}>
        <ShimmerBlock width={80} height={20} color={shimmer} />
        <ShimmerBlock width="100%" height={64} borderRadius={14} color={shimmer} />
        <ShimmerBlock width="100%" height={64} borderRadius={14} color={shimmer} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
const profileCache = new Map<string, { user: User; isFollowing: boolean; currentUserId: number }>();

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = userProfileStyles(theme);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const scrollY = useRef(new Animated.Value(0)).current;

  const cached = userId ? profileCache.get(userId) : undefined;

  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [tours, setTours] = useState<Tour[]>([]);
  const [toursLoading, setToursLoading] = useState(false);

  const stickyOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT * 0.5, HEADER_HEIGHT * 0.7],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const loadTours = useCallback(async () => {
    if (!userId) return;

    setToursLoading(true);
    try {
      const results = await getUserPublishedTours(userId);
      setTours(results);
    } catch {
      setTours([]);
    } finally {
      setToursLoading(false);
    }
  }, [userId]);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setLoadError(false);
    setCurrentUserId(null);
    setIsFollowing(false);
    setIsGuest(true);

    try {
      let meId: number | null = null;
      try {
        const me = await getCurrentUser();
        if (!me) {
          setIsGuest(true);
        } else {
          meId = me.id;
          setCurrentUserId(me.id);
          setIsGuest(false);
        }
      } catch {
        setIsGuest(true);
      }

      const fetchFollowings =
        meId !== null ? getUserFollowings(meId.toString()) : Promise.resolve([]);
      const [targetUser, followings] = await Promise.all([getUserById(userId), fetchFollowings]);

      const following = meId !== null && followings.some((f) => f.id === parseInt(userId, 10));
      if (meId !== null) {
        profileCache.set(userId, {
          user: targetUser,
          isFollowing: following,
          currentUserId: meId,
        });
      }
      setUser(targetUser);
      setIsFollowing(following);
      loadTours();
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [loadTours, userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleFollowToggle = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            follower_count: wasFollowing ? prev.follower_count - 1 : prev.follower_count + 1,
          }
        : prev
    );
    try {
      if (wasFollowing) {
        await unfollowUser({ following: user.id });
      } else {
        await followUser({ following: user.id });
      }
      if (userId) {
        const entry = profileCache.get(userId);
        if (entry) profileCache.set(userId, { ...entry, isFollowing: !wasFollowing });
      }
    } catch {
      setIsFollowing(wasFollowing);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              follower_count: wasFollowing ? prev.follower_count + 1 : prev.follower_count - 1,
            }
          : prev
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────

  if (loading) return <SkeletonLoading theme={color} />;

  // ── Error ──────────────────────────────────────────────

  if (loadError || !user) {
    return (
      <View
        style={[styles.errorRoot, { backgroundColor: color.background, paddingTop: insets.top }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { position: 'absolute', top: insets.top + 8, left: Spacing.md },
          ]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={color.text} />
        </TouchableOpacity>
        <View style={styles.errorCard}>
          <View style={[styles.errorIconWrap, { backgroundColor: `${color.error}12` }]}>
            <Ionicons name="alert-circle-outline" size={36} color={color.error} />
          </View>
          <Text style={styles.errorTitle}>{t('profile.errorTitle')}</Text>
          <Text style={styles.errorSubtitle}>{t('profile.userProfileError')}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              loadProfile();
            }}
            style={[styles.followButton, styles.followButtonFollow, { marginHorizontal: 0 }]}
          >
            <Text style={[styles.followButtonText, { color: color.white }]}>
              {t('common.retry', { defaultValue: 'Try Again' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Profile ────────────────────────────────────────────

  const isSelf = currentUserId === user.id;
  const levelInfo = computeLevelInfo(user.xp);
  const stickyGradientColors = getLevelTier(levelInfo.level).gradient;

  return (
    <View style={styles.root}>
      {/* Back button — always visible on top of the hero */}
      <View style={[styles.backButtonOverlay, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={color.white} />
        </TouchableOpacity>
      </View>

      {/* Sticky username bar — fades in on scroll */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stickyBar,
          {
            paddingTop: insets.top,
            height: insets.top + 52,
            opacity: stickyOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={stickyGradientColors}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.stickyBarText}>{user.username}</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl * 2 + insets.bottom }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        {/* Header — reuses exact same component as own profile */}
        <ProfileHeaderComp
          title={user.username}
          subtitle={user.country}
          avatarUrl={user.avatar_url || undefined}
          scrollY={scrollY}
          level={levelInfo.level}
          levelTitle={levelInfo.title}
          xpProgressPercent={levelInfo.xp_progress_percent}
          currentXp={levelInfo.current_xp}
          xpForCurrentLevel={levelInfo.xp_for_current_level}
          xpForNextLevel={levelInfo.xp_for_next_level}
          disableCopilot={true}
        />

        {/* Stats card — overlaps the header via its built-in marginTop: -32 */}
        <ProfileStatsComp
          km={Number(user.total_walked_km ?? 0)}
          tours={user.tour_count}
          followers={user.follower_count}
          following={user.following_count}
          onFollowersPress={
            isGuest
              ? undefined
              : () =>
                  router.push({
                    pathname: '/profile/followers',
                    params: { userId: user.id.toString() },
                  })
          }
          onFollowingPress={
            isGuest
              ? undefined
              : () =>
                  router.push({
                    pathname: '/profile/following',
                    params: { userId: user.id.toString() },
                  })
          }
          disableCopilot={true}
        />

        {/* Follow / Unfollow / Login to Follow */}
        {!isSelf &&
          (isGuest ? (
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  t('profile.loginToFollowTitle', 'Login Required'),
                  t('profile.loginToFollowMessage', 'You need to log in to follow this user.'),
                  [
                    { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                    { text: t('auth.login', 'Log In'), onPress: () => router.push('/login') },
                  ]
                )
              }
              style={[styles.followButton, styles.followButtonFollow]}
            >
              <Ionicons name="log-in-outline" size={16} color={color.white} />
              <Text style={[styles.followButtonText, { color: color.white }]}>
                {t('profile.loginToFollow', 'Log in to follow')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFollowToggle}
              disabled={followLoading}
              style={[
                styles.followButton,
                isFollowing ? styles.followButtonUnfollow : styles.followButtonFollow,
              ]}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? color.subText : color.white} />
              ) : (
                <>
                  <Ionicons
                    name={isFollowing ? 'person-remove-outline' : 'person-add-outline'}
                    size={16}
                    color={isFollowing ? color.subText : color.white}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: isFollowing ? color.subText : color.white },
                    ]}
                  >
                    {isFollowing
                      ? t('profile.userProfileUnfollow')
                      : t('profile.userProfileFollow')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ))}

        {/* Published tours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>{t('profile.tours')}</Text>
          </View>

          {toursLoading ? (
            <ActivityIndicator size="small" color={color.primary} style={styles.sectionLoader} />
          ) : tours.length === 0 ? (
            <Text style={styles.emptyText}>{t('profile.emptyPublished')}</Text>
          ) : (
            <View style={styles.toursList}>
              {tours.map((tour) => (
                <ProfileTourCard key={tour.id} tour={tour} />
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
