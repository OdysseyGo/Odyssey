import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import ProfileHeaderComp from '@/components/ProfileComponents/ProfileHeaderComp';
import ProfileStatsComp from '@/components/ProfileComponents/ProfileStatsComp';
import ProfileAddFriendsButton from '@/components/ProfileComponents/ProfileAddFriendsButton';
import ProfileBadgesContainer from '@/components/ProfileComponents/ProfileBadgesContainer';
import ProfileToursContainer from '@/components/ProfileComponents/ProfileToursContainer';
import AddFriendsModal from '@/components/ProfileComponents/AddFriendsModal';
import AvatarSelectionModal from '@/components/ProfileComponents/AvatarSelectionModal';
import AuthButton from '@/components/LoginComponents/AuthButton';
import { getMe, User } from '@/api/users';
import { getMyBadges, Badge } from '@/api/profile';
import { removeAuthToken } from '@/api/auth';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 240;

async function getAccessToken() {
  return await SecureStore.getItemAsync('userToken');
}

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
      style={[{ width: width as any, height, borderRadius, backgroundColor: color, opacity }, style]}
    />
  );
}

function SkeletonLoading({ theme }: { theme: (typeof Colors)['light'] }) {
  const shimmer = theme.foregroundSecondary;
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header skeleton */}
      <View
        style={{
          backgroundColor: theme.headerGradientTop,
          alignItems: 'center',
          paddingTop: 80,
          paddingBottom: 60,
        }}
      >
        <ShimmerBlock
          width={104}
          height={104}
          borderRadius={52}
          color="rgba(255,255,255,0.2)"
        />
        <ShimmerBlock
          width={140}
          height={22}
          color="rgba(255,255,255,0.2)"
          style={{ marginTop: 14 }}
        />
        <ShimmerBlock
          width={90}
          height={24}
          borderRadius={999}
          color="rgba(255,255,255,0.15)"
          style={{ marginTop: 10 }}
        />
      </View>
      {/* Stats skeleton */}
      <View style={{ alignItems: 'center', marginTop: -Spacing.xxl }}>
        <ShimmerBlock width="88%" height={70} borderRadius={22} color={shimmer} />
      </View>
      {/* Content skeleton */}
      <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, gap: Spacing.lg }}>
        <ShimmerBlock width={120} height={20} color={shimmer} />
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <ShimmerBlock width={100} height={100} borderRadius={16} color={shimmer} />
          <ShimmerBlock width={100} height={100} borderRadius={16} color={shimmer} />
          <ShimmerBlock width={100} height={100} borderRadius={16} color={shimmer} />
        </View>
        <ShimmerBlock width={120} height={20} color={shimmer} style={{ marginTop: Spacing.md }} />
        <ShimmerBlock width="100%" height={44} borderRadius={14} color={shimmer} />
        <ShimmerBlock width="100%" height={64} borderRadius={16} color={shimmer} />
        <ShimmerBlock width="100%" height={64} borderRadius={16} color={shimmer} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

export default function Profile() {
  const [curUser, setCurUser] = useState<User | null>(null);
  const [badgesCount, setBadgesCount] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const stickyOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT * 0.5, HEADER_HEIGHT * 0.7],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        const token = await getAccessToken();

        if (!token) {
          setHasToken(false);
          setLoading(false);
          return;
        }

        setHasToken(true);
        try {
          const user = await getMe();
          const badgesResponse = await getMyBadges();

          if (isActive) {
            setCurUser(user);
            setBadgesCount(badgesResponse.count);
            setBadges(badgesResponse.results);
          }
        } catch (err) {
          console.error('Failed to load profile:', err);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchProfile();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    await removeAuthToken();
    setHasToken(false);
    setCurUser(null);
    router.push('/login');
  };

  // ─── Not logged in ────────────────────────────────────

  if (hasToken === false) {
    return (
      <View
        style={[
          styles.notLoggedIn,
          { backgroundColor: theme.background, paddingTop: insets.top },
        ]}
      >
        <View style={[styles.notLoggedInCard, { backgroundColor: theme.cardSurface }]}>
          <View style={[styles.loginIconWrap, { backgroundColor: `${theme.primary}12` }]}>
            <Ionicons name="person-outline" size={36} color={theme.primary} />
          </View>
          <Text style={[styles.loginTitle, { color: theme.text }]}>
            {t('profile.notLoggedInTitle', { defaultValue: 'Welcome to Odyssey' })}
          </Text>
          <Text style={[styles.loginSubtext, { color: theme.subText }]}>
            {t('profile.notLoggedIn')}
          </Text>
          <AuthButton title={t('profile.loginButton')} onPress={() => router.push('/login')} />
        </View>
      </View>
    );
  }

  // ─── Loading ──────────────────────────────────────────

  if (loading || !curUser) {
    return <SkeletonLoading theme={theme} />;
  }

  // ─── Profile data ─────────────────────────────────────

  const profileHeader = {
    title: curUser.username,
    subtitle: curUser.country,
    avatarUrl: curUser.avatar_url || undefined,
    onAvatarPress: () => setShowAvatarModal(true),
  };

  const profileStats = {
    xp: curUser.xp,
    tours: curUser.tour_count,
    badges: badgesCount,
    followers: curUser.follower_count,
    following: curUser.follow_count,
  };

  const formattedBadges = badges.map((badge) => ({
    id: badge.id.toString(),
    name: badge.name,
    icon: badge.icon,
    description: badge.description,
    unlocked: true,
    earnedDate: badge.created_at,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* ─── Sticky mini-header (fades in on scroll) ─ */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stickyBar,
          {
            paddingTop: insets.top,
            height: insets.top + 52,
            backgroundColor: theme.primary,
            opacity: stickyOpacity,
          },
        ]}
      >
        <Text style={styles.stickyBarText}>{curUser.username}</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl + insets.bottom }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* ─── Header ──────────────────────────────── */}
        <ProfileHeaderComp {...profileHeader} scrollY={scrollY} />

        {/* ─── Stats (overlaps header) ─────────────── */}
        <ProfileStatsComp {...profileStats} />

        {/* ─── Actions ─────────────────────────────── */}
        <View style={styles.actionsRow}>
          <ProfileAddFriendsButton onPress={() => setShowAddFriendModal(true)} />
        </View>

        {/* ─── Badges ──────────────────────────────── */}
        <ProfileBadgesContainer
          badges={formattedBadges}
          title={t('profile.badges')}
        />

        {/* ─── My Tours ────────────────────────────── */}
        <ProfileToursContainer />

        {/* ─── Logout ──────────────────────────────── */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.error }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {/* ─── Modals ────────────────────────────────── */}
      <AddFriendsModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchFocused={searchFocused}
        onSearchFocus={setSearchFocused}
      />
      <AvatarSelectionModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatarUrl={curUser.avatar_url || undefined}
        onAvatarSaved={(url) => setCurUser((prev) => (prev ? { ...prev, avatar_url: url } : prev))}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Not logged in
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notLoggedInCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: 26,
    gap: Spacing.md,
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(45,50,68,0.14)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 28,
      },
      android: { elevation: 6 },
    }),
  },
  loginIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  loginSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Sticky mini-header
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  stickyBarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Actions
  actionsRow: {
    alignItems: 'center',
    marginTop: Spacing.lg + 2,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadiusFull,
    borderWidth: 1.5,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
