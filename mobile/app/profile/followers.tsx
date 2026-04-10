import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getUserFollowers, removeFollower, User } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { styles, rowStyles } from './followList.styles';
import { FollowersUserRowProps } from './followers.config';

function UserRow({ item, theme, onRemove, removing }: FollowersUserRowProps) {
  const { t } = useTranslation();
  const initials =
    item.first_name && item.last_name
      ? `${item.first_name[0]}${item.last_name[0]}`.toUpperCase()
      : item.username[0].toUpperCase();

  return (
    <View style={[rowStyles.row, { borderBottomColor: theme.borderLight }]}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={rowStyles.avatar} />
      ) : (
        <View style={[rowStyles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
          <Text style={rowStyles.initials}>{initials}</Text>
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
      <TouchableOpacity
        style={[rowStyles.actionButton, { borderColor: theme.error ?? '#EF4444' }]}
        onPress={() => onRemove(item.id)}
        disabled={removing}
      >
        {removing ? (
          <ActivityIndicator size="small" color={theme.error ?? '#EF4444'} />
        ) : (
          <Text style={[rowStyles.actionButtonText, { color: theme.error ?? '#EF4444' }]}>
            {t('profile.removeFollower', 'Remove')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function FollowersPage() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const theme = useColorTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    getUserFollowers(userId)
      .then(setUsers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRemove = async (followerId: number) => {
    setRemovingId(followerId);
    try {
      await removeFollower(followerId);
      setUsers((prev) => prev.filter((u) => u.id !== followerId));
    } catch {
      // silently ignore — user stays in list if request fails
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.followersTitle', 'Followers')}</Text>
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
            {t('profile.followersError', 'Could not load followers')}
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
              onRemove={handleRemove}
              removing={removingId === item.id}
            />
          )}
          contentContainerStyle={
            users.length === 0 ? styles.centered : { paddingBottom: insets.bottom + Spacing.xl }
          }
          ListEmptyComponent={
            <Text style={[styles.message, { color: colors.subText }]}>
              {t('profile.followersEmpty', 'No followers yet')}
            </Text>
          }
        />
      )}
    </View>
  );
}
