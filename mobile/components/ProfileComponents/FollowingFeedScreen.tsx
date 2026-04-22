import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
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
import BackButton from '@/components/common/BackButton';
import { followingFeedStyles } from './FollowingFeedScreen.styles';
import { FeedCardProps } from './FollowingFeedScreen.config';

function getDifficultyColor(difficulty: string, color: (typeof Colors)['light']): string {
  const d = difficulty?.toLowerCase();
  if (d === 'easy') return color.easy;
  if (d === 'hard') return color.hard;
  return color.medium;
}

function formatCompletedAt(dateString: string, t: FeedCardProps['t']): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('profile.feedToday');
  if (diffDays === 1) return t('profile.feedYesterday');
  if (diffDays < 7) return t('profile.feedDaysAgo', { count: diffDays });
  return date.toLocaleDateString();
}

const FeedCard = React.memo(function FeedCard({ item, styles, color, t }: FeedCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const [avatarError, setAvatarError] = useState(false);

  const handlePressIn = () => (scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }));
  const handlePressOut = () => (scale.value = withSpring(1, { damping: 10, stiffness: 100 }));

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
          <Ionicons name="checkmark-circle" size={12} color={color.easy} />
          <Text style={styles.completionText}>{t('profile.feedCompletedBadge')}</Text>
        </View>

        <View style={styles.durationPill}>
          <Ionicons name="time-outline" size={11} color={color.white} />
          <Text style={styles.durationText}>{item.tour.duration_minutes}min</Text>
        </View>

        <View style={styles.infoOverlay}>
          <TouchableOpacity
            onPress={() => router.push(`/profile/${item.user.id}`)}
            style={[styles.userHeader, { alignSelf: 'flex-start' }]}
            activeOpacity={0.7}
          >
            {item.user.avatar_url && !avatarError ? (
              <Image
                source={{ uri: item.user.avatar_url }}
                style={styles.userAvatar}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.userAvatarFallback, { backgroundColor: color.white }]}>
                <Ionicons name="person" size={14} color={color.subText} />
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
              {item.tour.city ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.cityText}>{item.tour.city}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.completedAt}>{formatCompletedAt(item.completed_at, t)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function FollowingFeedScreen() {
  const { t } = useTranslation();
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = followingFeedStyles(theme);
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const pageRef = useRef(1);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async (pageNum: number = 1) => {
    try {
      setError(false);
      const response: FollowingFeedResponse = await getFollowingFeed(pageNum);
      if (pageNum === 1) {
        setFeed(response.results);
      } else {
        setFeed((prev) => [...prev, ...response.results]);
      }
      setHasMore(response.next !== null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      const nextPage = pageRef.current + 1;
      pageRef.current = nextPage;
      setLoadingMore(true);
      fetchFeed(nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    pageRef.current = 1;
    setHasMore(true);
    fetchFeed(1);
  };

  const handleRetry = () => {
    setLoading(true);
    pageRef.current = 1;
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
        <BackButton color={color.white} size={26} style={styles.backButton} />
        <Text style={styles.headerTitle}>{t('profile.followingFeedTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      {error ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={56} color={color.subText} />
          <Text style={styles.emptyText}>{t('profile.feedLoadError')}</Text>
          <TouchableOpacity onPress={handleRetry} style={{ marginTop: 12 }}>
            <Text style={{ color: color.primary, fontWeight: '600', fontSize: 15 }}>
              {t('profile.feedRetry')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ) : feed.length === 0 ? (
        refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={color.primary} />
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color={color.subText} />
            <Text style={styles.emptyText}>{t('profile.feedEmptyTitle')}</Text>
            <Text style={styles.emptySubtext}>{t('profile.feedEmptySubtext')}</Text>
          </Animated.View>
        )
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
