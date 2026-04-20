import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getUserById, getMe, getUserFollowings, followUser, unfollowUser, User } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { userProfileStyles } from './UserProfileScreen.styles';
import { StatItem } from './UserProfileScreen.config';

const profileCache = new Map<string, { user: User; isFollowing: boolean; currentUserId: number }>();

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = userProfileStyles(theme);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const cached = userId ? profileCache.get(userId) : undefined;

  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [loading, setLoading] = useState(!cached);
  const [isFollowing, setIsFollowing] = useState(cached?.isFollowing ?? false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(cached?.currentUserId ?? null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setAvatarError(false);
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const me = await getMe();
      setCurrentUserId(me.id);
      const [targetUser, followings] = await Promise.all([
        getUserById(userId!),
        getUserFollowings(me.id.toString()),
      ]);
      const following = followings.some((f) => f.id === parseInt(userId!));
      profileCache.set(userId!, { user: targetUser, isFollowing: following, currentUserId: me.id });
      setUser(targetUser);
      setIsFollowing(following);
    } catch {
      if (!user) setUser(null);
    } finally {
      setLoading(false);
    }
  };

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

  const Header = () => (
    <View style={[styles.header, { backgroundColor: color.primary, paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color={color.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{user?.username ?? ''}</Text>
      <View style={styles.backButton} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={color.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={44} color={color.subText} />
          <Text style={styles.errorText}>{t('profile.userProfileError')}</Text>
        </View>
      </View>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const isSelf = currentUserId === user.id;

  const stats: StatItem[] = [
    { label: t('profile.xp'), value: user.xp },
    { label: t('profile.tours'), value: user.tour_count },
    { label: t('profile.followers'), value: user.follower_count },
    { label: t('profile.following'), value: user.following_count },
  ];

  return (
    <View style={styles.root}>
      <Header />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
      >
        <View style={styles.avatarSection}>
          {user.avatar_url && !avatarError ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={[styles.avatar, styles.avatarImage]}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: color.white }]}>
              <Ionicons name="person" size={40} color={color.subText} />
            </View>
          )}

          {fullName ? <Text style={styles.fullName}>{fullName}</Text> : null}

          {user.country ? <Text style={styles.country}>📍 {user.country}</Text> : null}

          {!isSelf && (
            <TouchableOpacity
              onPress={handleFollowToggle}
              disabled={followLoading}
              style={[
                styles.followButton,
                isFollowing
                  ? {
                      backgroundColor: color.foreground,
                      borderWidth: 1.5,
                      borderColor: color.borderLight,
                    }
                  : { backgroundColor: color.primary },
              ]}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? color.subText : color.white} />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    { color: isFollowing ? color.subText : color.white },
                  ]}
                >
                  {isFollowing ? t('profile.userProfileUnfollow') : t('profile.userProfileFollow')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View
              key={s.label}
              style={[styles.statItem, i < stats.length - 1 && styles.statDivider]}
            >
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
