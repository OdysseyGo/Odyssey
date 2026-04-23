import React, { useCallback, useState, useRef, useEffect, startTransition } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import SettingsScreen from '@/app/profile/settings';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { CopilotProvider, CopilotStep, walkthroughable } from 'react-native-copilot';

import ProfileHeaderComp from '@/components/ProfileComponents/ProfileHeaderComp';
import ProfileStatsComp from '@/components/ProfileComponents/ProfileStatsComp';
import ProfileAddFriendsButton from '@/components/ProfileComponents/ProfileAddFriendsButton';
import ProfileFollowingFeedButton from '@/components/ProfileComponents/ProfileFollowingFeedButton';
import ProfileBadgesContainer from '@/components/ProfileComponents/ProfileBadgesContainer';
import ProfileToursContainer from '@/components/ProfileComponents/ProfileToursContainer';
import AddFriendsModal from '@/components/ProfileComponents/AddFriendsModal';
import AvatarSelectionModal from '@/components/ProfileComponents/AvatarSelectionModal';
import AuthButton from '@/components/LoginComponents/AuthButton';
import { getMe, User } from '@/api/users';
import { getMyBadges, Badge } from '@/api/profile';
import { removeAuthToken } from '@/api/auth';
import { consumeProfileNeedsRefresh } from '@/lib/profileRefresh';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { ScrollView } from 'react-native';
import { useAutoStartTour } from '@/hooks/useAutoStartHook';
import TutorialsModal from '../profile/tutorials';
import CustomTooltip from '@/components/TutorialComponents/CustomTooltip';
import CustomStepNumber from '@/components/TutorialComponents/CustomStepNumber';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 240;
const GUEST_HERO_HEIGHT = SCREEN_HEIGHT < 700 ? SCREEN_HEIGHT * 0.3 : SCREEN_HEIGHT * 0.35;

async function getAccessToken() {
  return await SecureStore.getItemAsync('userToken');
}

const WalkthroughableView = walkthroughable(View);

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
          color={theme.profileSkeletonShimmerStrong}
        />
        <ShimmerBlock
          width={140}
          height={22}
          color={theme.profileSkeletonShimmerStrong}
          style={{ marginTop: 14 }}
        />
        <ShimmerBlock
          width={90}
          height={24}
          borderRadius={999}
          color={theme.profileSkeletonShimmerSoft}
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
// Guest screen (not logged in)
// ─────────────────────────────────────────────────────────

function GuestScreen({
  theme,
  insets,
  t,
}: {
  theme: (typeof Colors)['light'];
  insets: ReturnType<typeof useSafeAreaInsets>;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const cardY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardY, { toValue: 0, duration: 580, delay: 100, useNativeDriver: true }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 580,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const features = [
    {
      icon: 'map-outline' as const,
      label: t('profile.feature1'),
    },
    {
      icon: 'trophy-outline' as const,
      label: t('profile.feature2'),
    },
    {
      icon: 'people-outline' as const,
      label: t('profile.feature3'),
    },
  ];

  return (
    <View style={[guestStyles.root, { backgroundColor: theme.headerGradientTop }]}>
      {/* ── Hero ── */}
      <View style={[guestStyles.hero, { paddingTop: insets.top, height: GUEST_HERO_HEIGHT }]}>
        <View
          style={[guestStyles.iconRing, { backgroundColor: theme.profileGuestIconRingBackground }]}
        >
          <Ionicons name="compass" size={44} color={theme.white} />
        </View>
        <Text style={[guestStyles.appName, { color: theme.white }]}>ODYSSEY</Text>
        <Text style={[guestStyles.tagline, { color: theme.profileGuestTaglineText }]}>
          {t('auth.tagline')}
        </Text>
      </View>

      {/* ── Card ── */}
      <Animated.View
        style={[
          guestStyles.card,
          {
            backgroundColor: theme.background,
            paddingBottom: insets.bottom + Spacing.xl,
            opacity: cardOpacity,
            transform: [{ translateY: cardY }],
          },
        ]}
      >
        <Text style={[guestStyles.cardTitle, { color: theme.text }]}>
          {t('profile.signInToUnlock')}
        </Text>
        <Text style={[guestStyles.cardSubtitle, { color: theme.subText }]}>
          {t('profile.signInSubtitle')}
        </Text>

        {/* Feature bullets */}
        <View style={guestStyles.features}>
          {features.map((f) => (
            <View key={f.icon} style={guestStyles.featureRow}>
              <View style={[guestStyles.featureIcon, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name={f.icon} size={18} color={theme.primary} />
              </View>
              <Text style={[guestStyles.featureLabel, { color: theme.subText }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Log in CTA */}
        <TouchableOpacity
          style={[guestStyles.loginButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <Text style={guestStyles.loginButtonText}>{t('profile.loginButton')}</Text>
          <Ionicons name="arrow-forward" size={18} color={theme.white} />
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={guestStyles.signUpRow}>
          <Text style={[guestStyles.signUpLabel, { color: theme.subText }]}>
            {t('auth.noAccountLabel', { defaultValue: "Don't have an account?" })}
          </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={[guestStyles.signUpLink, { color: theme.primary }]}>
              {` ${t('auth.signUp', { defaultValue: 'Sign up' })}`}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const guestStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xxl,
  },
  iconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 5,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  features: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: Spacing.borderRadiusFull,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signUpLabel: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

function ProfileContent() {
  const [curUser, setCurUser] = useState<User | null>(null);
  const [badgesCount, setBadgesCount] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const lastRetryKeyRef = useRef(retryKey);

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastRefreshed = useRef<number>(0);

  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const scrollViewRef = useRef<ScrollView>(null);
  useAutoStartTour('PROFILE_TUTORIAL', !loading && !!curUser, scrollViewRef)

  const stickyOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT * 0.5, HEADER_HEIGHT * 0.7],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const refreshProfile = useCallback(async () => {
    const token = await getAccessToken();

    if (!token) {
      setHasToken(false);
      setLoading(false);
      return;
    }

    setHasToken(true);
    setFetchError(false);
    try {
      const user = await getMe();
      const badgesResponse = await getMyBadges();
      startTransition(() => {
        setCurUser(user);
        setBadgesCount(badgesResponse.count);
        setBadges(badgesResponse.results);
      });
      lastRefreshed.current = Date.now();
    } catch (err) {
      console.error('Failed to load profile:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const hasData = lastRefreshed.current > 0;
      const isStale = now - lastRefreshed.current > 30_000;
      const forceRefresh = consumeProfileNeedsRefresh();
      if (!hasData) setLoading(true);
      if (!hasData || isStale || forceRefresh) refreshProfile();
    }, [retryKey])
  );

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle', { defaultValue: 'Log out' }),
      t('profile.logoutConfirmMessage', { defaultValue: 'Are you sure you want to log out?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await removeAuthToken();
            setHasToken(false);
            setCurUser(null);
            router.push('/login');
          },
        },
      ]
    );
  };

  // ─── Not logged in ────────────────────────────────────

  if (hasToken === false) {
    return <GuestScreen theme={theme} insets={insets} t={t} />;
  }

  // ─── Loading ──────────────────────────────────────────

  if (loading) {
    return <SkeletonLoading theme={theme} />;
  }

  // ─── Error ────────────────────────────────────────────

  if (fetchError || !curUser) {
    return (
      <View
        style={[errorStyles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}
      >
        <View style={[errorStyles.card, { backgroundColor: theme.cardSurface }]}>
          <View style={[errorStyles.iconWrap, { backgroundColor: `${theme.error}12` }]}>
            <Ionicons name="alert-circle-outline" size={36} color={theme.error} />
          </View>
          <Text style={[errorStyles.title, { color: theme.text }]}>
            {t('profile.errorTitle', { defaultValue: 'Something went wrong' })}
          </Text>
          <Text style={[errorStyles.subtitle, { color: theme.subText }]}>
            {t('profile.errorMessage', {
              defaultValue: "We couldn't load your profile. Please try again.",
            })}
          </Text>
          <AuthButton
            title={t('common.retry', { defaultValue: 'Try Again' })}
            onPress={() => {
              setFetchError(false);
              setRetryKey((k) => k + 1);
            }}
          />
        </View>
      </View>
    );
  }

  // ─── Profile data ─────────────────────────────────────

  const profileHeader = {
    title: curUser.username,
    subtitle: curUser.country,
    avatarUrl: curUser.avatar_url || undefined,
    onAvatarPress: () => setShowAvatarModal(true),
    onSettingsPress: () => setShowSettings(true),
    settingsAccessibilityLabel: t('tabs.settings'),
    onTutorialsPress: () => setShowTutorials(true),
    tutorialsAccessibilityLabel: t('tabs.tutorials'), //TODO: add this to translations
  };

  const profileStats = {
    xp: curUser.xp,
    tours: curUser.tour_count,
    badges: badgesCount,
    followers: curUser.follower_count,
    following: curUser.following_count,
  };

  const formattedBadges = badges.map((badge) => ({
    id: badge.id.toString(),
    name: badge.name,
    icon: badge.icon,
    description: badge.description,
    unlocked: true,
    earnedDate: badge.created_at,
  }));

  const handleFollowersPress = () => {
    router.push({ pathname: '/profile/followers', params: { userId: curUser.id.toString() } });
  };

  const handleFollowingPress = () => {
    router.push({ pathname: '/profile/following', params: { userId: curUser.id.toString() } });
  };

  const handleBadgesPress = () => {
    //router.push({pathname: '/profile/badges'});
    //alert('deneme');
  };

  const handleToursPress = () => {
    router.push('/(tour)/my-completed-tours');
  };

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
        <Text style={[styles.stickyBarText, { color: theme.white }]}>{curUser.username}</Text>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl + insets.bottom }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        <CopilotStep text={t('tutorial.profile.step1text')} order={1} name="profileIntro">
        <WalkthroughableView>
        {/* ─── Header ──────────────────────────────── */}
        <ProfileHeaderComp {...profileHeader} scrollY={scrollY} />
         </WalkthroughableView>
        </CopilotStep>

        {/* ─── Stats (overlaps header) ─────────────── */}
        <ProfileStatsComp
          {...profileStats}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
          onToursPress={handleToursPress}
        />

        {/* ─── Actions ─────────────────────────────── */}
        <CopilotStep text= {t('tutorial.profile.step4text')} order={4} name="friendsStep">
          <WalkthroughableView>
            <View style={styles.actionsRow}>
              <ProfileAddFriendsButton onPress={() => setShowAddFriendModal(true)} />
              <ProfileFollowingFeedButton />
            </View>
          </WalkthroughableView>
        </CopilotStep>

        {/* ─── Badges ──────────────────────────────── */}
        <CopilotStep text= {t('tutorial.profile.step5text')} order={5} name="badgeStep">
          <WalkthroughableView>
            <ProfileBadgesContainer badges={formattedBadges} title={t('profile.badges')} />
          </WalkthroughableView>
        </CopilotStep>

        {/* ─── My Tours ────────────────────────────── */}
        <CopilotStep text= {t('tutorial.profile.step6text')} order={6} name="tourCreatorStep">
          <WalkthroughableView>
            <ProfileToursContainer />
          </WalkthroughableView>
        </CopilotStep>
        

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
        onClose={() => {
          setShowAddFriendModal(false);
          refreshProfile();
        }}
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

      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>

      <Modal visible={showTutorials} transparent animationType="fade">
        <TutorialsModal onClose={() => setShowTutorials(false)} />
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    letterSpacing: -0.3,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg + 2,
    marginBottom:  Spacing.sm,
    gap: Spacing.md,
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

const errorStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: 26,
    gap: Spacing.md,
    maxWidth: 320,
    width: '100%',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
});


export default function Profile() {

  const colorTheme = useColorTheme();
  
  return (
    <CopilotProvider 
        margin={8}
        animated={true} 
        overlay="svg" 
        tooltipComponent={CustomTooltip}
        stepNumberComponent= {CustomStepNumber}
        animationDuration={600}
        arrowColor={Colors[colorTheme].primary}
        tooltipStyle={{ 
          backgroundColor: 'transparent', 
          padding: 0,                     
          borderRadius: 0,
        }}
        backdropColor="rgba(10, 20, 40, 0.9)"
      >
      <ProfileContent />
    </CopilotProvider>
  );
}