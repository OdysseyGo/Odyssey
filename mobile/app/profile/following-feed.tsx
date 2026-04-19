import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { getFollowingFeed, FeedItem, FollowingFeedResponse } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { followingFeedStyles } from './following-feed.styles';
import { FeedCardProps } from './following-feed.config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ['#0284C7', '#D97706', '#16A34A', '#DC2626', '#7C3AED', '#0891B2'];

function getAvatarColor(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = username.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function getDifficultyColor(difficulty: string, color: (typeof Colors)['light']): string {
  const d = difficulty?.toLowerCase();
  if (d === 'easy') return color.easy;
  if (d === 'hard') return color.hard;
  return color.medium;
}

// ─── Card ────────────────────────────────────────────────────────────────────

function FeedCard({ item, styles, color, t }: FeedCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => (scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }));
  const handlePressOut = () => (scale.value = withSpring(1, { damping: 10, stiffness: 100 }));

  const formatCompletedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('profile.feedToday');
    if (diffDays === 1) return t('profile.feedYesterday');
    if (diffDays < 7) return t('profile.feedDaysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const userInitial = item.user.username?.[0]?.toUpperCase() ?? '?';
  const avatarColor = getAvatarColor(item.user.username);
  const difficultyColor = getDifficultyColor(item.tour.difficulty, color);

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <TouchableOpacity
        onPress={() => router.push(`/tour/${item.tour.id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
        activeOpacity={1}
      >
        {item.tour.cover_image ? (
          <Image source={{ uri: item.tour.cover_image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="map-outline" size={52} color={color.subText} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
          locations={[0, 0.42, 1]}
          style={styles.gradient}
        />

        <View style={styles.completionBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
          <Text style={styles.completionText}>{t('profile.feedCompletedBadge')}</Text>
        </View>

        <View style={styles.durationPill}>
          <Ionicons name="time-outline" size={11} color={color.white} />
          <Text style={styles.durationText}>{item.tour.duration_minutes}min</Text>
        </View>

        <View style={styles.infoOverlay}>
          {/* Tapping the user row navigates to profile; tapping anywhere else goes to tour */}
          <TouchableOpacity
            onPress={() => router.push(`/profile/${item.user.id}`)}
            style={styles.userHeader}
            activeOpacity={0.7}
          >
            {item.user.avatar_url ? (
              <Image
                source={{ uri: item.user.avatar_url }}
                style={[styles.userAvatar, { borderColor: 'rgba(255,255,255,0.5)' }]}
              />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.userAvatarText}>{userInitial}</Text>
              </View>
            )}
            <Text style={styles.userName}>{item.user.username}</Text>
          </TouchableOpacity>

          <Text style={styles.tourTitle} numberOfLines={2}>
            {item.tour.title}
          </Text>

          {item.tour.description ? (
            <Text style={styles.tourDescription} numberOfLines={1}>
              {item.tour.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaTags}>
              {item.tour.category ? (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{item.tour.category}</Text>
                </View>
              ) : null}
              {item.tour.difficulty ? (
                <View style={[styles.difficultyChip, { backgroundColor: difficultyColor + '33' }]}>
                  <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
                  <Text style={[styles.difficultyChipText, { color: difficultyColor }]}>
                    {item.tour.difficulty}
                  </Text>
                </View>
              ) : null}
              {item.tour.city ? <Text style={styles.cityText}>📍 {item.tour.city}</Text> : null}
            </View>
            <Text style={styles.completedAt}>{formatCompletedAt(item.completed_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function FollowingFeed() {
  const { t } = useTranslation();
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = followingFeedStyles(theme);
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async (pageNum: number = 1) => {
    try {
      const response: FollowingFeedResponse = await getFollowingFeed(pageNum);
      if (pageNum === 1) {
        setFeed(response.results);
      } else {
        setFeed((prev) => [...prev, ...response.results]);
      }
      setHasMore(!!response.next);
    } catch {
      Alert.alert(t('profile.feedErrorTitle'), t('profile.feedLoadError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(true);
      fetchFeed(nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchFeed(1);
  };

  if (loading && feed.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={color.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: color.primary, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={color.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.followingFeedTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      {feed.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color={color.subText} />
          <Text style={styles.emptyText}>{t('profile.feedEmptyTitle')}</Text>
          <Text style={styles.emptySubtext}>{t('profile.feedEmptySubtext')}</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={feed}
          renderItem={({ item }) => <FeedCard item={item} styles={styles} color={color} t={t} />}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={color.primary}
              colors={[color.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={color.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}
