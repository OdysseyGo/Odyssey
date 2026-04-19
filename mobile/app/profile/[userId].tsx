import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getUserById, getMe, getUserFollowings, followUser, unfollowUser, User } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { userProfileStyles } from './[userId].styles';
import { getAvatarColor, StatItem } from './[userId].config';

export default function UserProfilePage() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = userProfileStyles(theme);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
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
      setUser(targetUser);
      setIsFollowing(followings.some((f) => f.id === parseInt(userId!)));
    } catch {
      setUser(null);
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
        <Stack.Screen options={{ headerShown: false }} />
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
        <Stack.Screen options={{ headerShown: false }} />
        <Header />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={44} color={color.subText} />
          <Text style={styles.errorText}>{t('profile.userProfileError')}</Text>
        </View>
      </View>
    );
  }

  const avatarColor = getAvatarColor(user.username);
  const initial = user.username[0]?.toUpperCase() ?? '?';
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
      <Stack.Screen options={{ headerShown: false }} />
      <Header />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
      >
        {/* Avatar + name + follow */}
        <View style={styles.avatarSection}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          {fullName ? <Text style={styles.fullName}>{fullName}</Text> : null}

          {user.country ? (
            <Text style={styles.country}>📍 {user.country}</Text>
          ) : null}

          {!isSelf && (
            <TouchableOpacity
              onPress={handleFollowToggle}
              disabled={followLoading}
              style={[
                styles.followButton,
                isFollowing
                  ? { backgroundColor: color.foreground, borderWidth: 1.5, borderColor: color.borderLight }
                  : { backgroundColor: color.primary },
              ]}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? color.subText : color.white} />
              ) : (
                <Text style={[styles.followButtonText, { color: isFollowing ? color.subText : color.white }]}>
                  {isFollowing ? t('profile.userProfileUnfollow') : t('profile.userProfileFollow')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stats row */}
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
