import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getUserFollowings, getMe, followUser, unfollowUser, User } from '@/api/users';
import { setProfileNeedsRefresh } from '@/lib/profileRefresh';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { styles, rowStyles } from './FollowListStyles';
import { FollowingUserRowProps } from './FollowingScreen.config';
import BackButton from '@/components/common/BackButton';

function UserRow({
  item,
  theme,
  isOwnProfile,
  isFollowingItem,
  currentUserId,
  onUnfollow,
  unfollowing,
  onFollow,
  actionLoadingId,
}: FollowingUserRowProps) {
  const { t } = useTranslation();
  const [avatarError, setAvatarError] = useState(false);

  const isSelf = item.id === currentUserId;
  const actionLoading = actionLoadingId === item.id || unfollowing;

  const renderAction = () => {
    if (isSelf) return null;

    if (isOwnProfile) {
      return (
        <TouchableOpacity
          style={[rowStyles.actionButton, { borderColor: theme.primary }]}
          onPress={() => onUnfollow(item.id)}
          disabled={unfollowing}
        >
          {unfollowing ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[rowStyles.actionButtonText, { color: theme.primary }]}>
              {t('profile.unfollow', 'Unfollow')}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          rowStyles.actionButton,
          isFollowingItem ? { borderColor: theme.borderLight } : { borderColor: theme.primary },
        ]}
        onPress={() => (isFollowingItem ? onUnfollow(item.id) : onFollow(item.id))}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator size="small" color={isFollowingItem ? theme.subText : theme.primary} />
        ) : (
          <Text
            style={[
              rowStyles.actionButtonText,
              { color: isFollowingItem ? theme.subText : theme.primary },
            ]}
          >
            {isFollowingItem
              ? t('profile.unfollow', 'Unfollow')
              : t('profile.userProfileFollow', 'Follow')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[rowStyles.row, { borderBottomColor: theme.borderLight }]}>
      <TouchableOpacity
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
        onPress={() =>
          router.push({ pathname: '/profile/[userId]', params: { userId: item.id.toString() } })
        }
        activeOpacity={0.7}
      >
        {item.avatar_url && !avatarError ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={rowStyles.avatar}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <View style={[rowStyles.avatarPlaceholder, { backgroundColor: theme.foreground }]}>
            <Ionicons name="person" size={22} color={theme.subText} />
          </View>
        )}
        <View style={rowStyles.info}>
          <Text style={[rowStyles.username, { color: theme.text }]}>{item.username}</Text>
          {(item.first_name || item.last_name) && (
            <Text style={[rowStyles.fullName, { color: theme.subText }]}>
              {[item.first_name, item.last_name].filter(Boolean).join(' ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      {renderAction()}
    </View>
  );
}

export default function FollowingScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const theme = useColorTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unfollowingId, setUnfollowingId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [myFollowings, setMyFollowings] = useState<Set<number>>(new Set());
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadAll();
  }, [userId]);

  const loadAll = async () => {
    setLoading(true);
    setError(false);
    try {
      const me = await getMe();
      setCurrentUserId(me.id);
      const own = me.id === parseInt(userId!);
      setIsOwnProfile(own);

      // If own profile, the listed users ARE the followings — reuse them for myFollowings.
      // If another profile, fetch both in parallel.
      if (own) {
        const following = await getUserFollowings(userId!);
        setUsers(following);
        setMyFollowings(new Set(following.map((u) => u.id)));
      } else {
        const [following, myFollowing] = await Promise.all([
          getUserFollowings(userId!),
          getUserFollowings(me.id.toString()),
        ]);
        setUsers(following);
        setMyFollowings(new Set(myFollowing.map((u) => u.id)));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetId: number) => {
    if (isOwnProfile) {
      setUnfollowingId(targetId);
      setMyFollowings((prev) => {
        const s = new Set(prev);
        s.delete(targetId);
        return s;
      });
      try {
        await unfollowUser({ following: targetId });
        setUsers((prev) => prev.filter((u) => u.id !== targetId));
        setProfileNeedsRefresh();
      } catch {
        setMyFollowings((prev) => new Set([...prev, targetId]));
      } finally {
        setUnfollowingId(null);
      }
    } else {
      setActionLoadingId(targetId);
      setMyFollowings((prev) => {
        const s = new Set(prev);
        s.delete(targetId);
        return s;
      });
      try {
        await unfollowUser({ following: targetId });
        setProfileNeedsRefresh();
      } catch {
        setMyFollowings((prev) => new Set([...prev, targetId]));
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleFollow = async (targetId: number) => {
    setActionLoadingId(targetId);
    setMyFollowings((prev) => new Set([...prev, targetId]));
    try {
      await followUser({ following: targetId });
      setProfileNeedsRefresh();
    } catch {
      setMyFollowings((prev) => {
        const s = new Set(prev);
        s.delete(targetId);
        return s;
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}
      >
        <BackButton color={colors.white} size={26} style={styles.backButton} />
        <Text style={styles.headerTitle}>{t('profile.followingTitle', 'Following')}</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={[styles.message, { color: colors.subText }]}>
            {t('profile.followingError', 'Could not load following')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UserRow
              item={item}
              theme={colors}
              isOwnProfile={isOwnProfile}
              isFollowingItem={myFollowings.has(item.id)}
              currentUserId={currentUserId}
              onUnfollow={handleUnfollow}
              unfollowing={unfollowingId === item.id}
              onFollow={handleFollow}
              actionLoadingId={actionLoadingId}
            />
          )}
          contentContainerStyle={
            users.length === 0 ? styles.centered : { paddingBottom: insets.bottom + Spacing.xl }
          }
          ListEmptyComponent={
            <Text style={[styles.message, { color: colors.subText }]}>
              {t('profile.followingEmpty', 'Not following anyone yet')}
            </Text>
          }
        />
      )}
    </View>
  );
}
