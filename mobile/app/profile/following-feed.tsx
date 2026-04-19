import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { getFollowingFeed } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { followingFeedStyles } from './following-feed.styles';
import { FollowingFeedItem, FollowingFeedResponse } from './following-feed.config';

export default function FollowingFeed() {
  const { t } = useTranslation();
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = followingFeedStyles(theme);
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<FollowingFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
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
        setFeed(prev => [...prev, ...response.results]);
      }
      setHasMore(!!response.next);
    } catch (error) {
      Alert.alert('Error', 'Failed to load following feed');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  const renderItem = ({ item }: { item: FollowingFeedItem }) => {
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 40,
      }).start();
    };

    const handlePress = () => {
      router.push(`/tour/${item.tour.id}`);
    };

    const formatCompletedAt = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    };

    return ( 
      
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.card}
          activeOpacity={0.9}
        >
          {/* Tour image background */}
          {item.tour.cover_image ? (
            <Image
              source={{ uri: item.tour.cover_image }}
              style={styles.image}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image" size={48} color={color.subText} />
            </View>
          )}

          {/* Bottom gradient for text readability */}
          <LinearGradient
            colors={['transparent', color.overlay]}
            locations={[0, 1]}
            style={styles.gradient}
          />

          {/* Completion badge — top right */}
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={12} color={color.white} />
            <Text style={styles.completionText}>COMPLETED</Text>
          </View>

          {/* Duration pill — top left */}
          <View style={styles.durationPill}>
            <Ionicons name="time" size={11} color={color.white} />
            <Text style={styles.durationText}>{item.tour.duration_minutes}min</Text>
          </View>

          {/* Bottom info overlay */}
          <View style={styles.infoOverlay}>
            <View style={styles.userHeader}>
              <View style={styles.avatarContainer}>
                {item.user.avatar_url ? (
                  <Image
                    source={{ uri: item.user.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <Ionicons name="person-circle" size={20} color={color.white} />
                )}
              </View>
              <Text style={styles.userName}>{item.user.username}</Text>
              <Text style={styles.completedText}>completed this tour</Text>
            </View>

            <Text style={styles.tourTitle} numberOfLines={2}>
              {item.tour.title}
            </Text>

            {item.tour.description && (
              <Text style={styles.tourDescription} numberOfLines={2}>
                {item.tour.description}
              </Text>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaText} numberOfLines={1}>
                {item.tour.category} • {item.tour.difficulty}
                {item.tour.city && ` • 📍 ${item.tour.city}`}
              </Text>
              <Text style={styles.completedAt}>
                {formatCompletedAt(item.completed_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && feed.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: color.background }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: color.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: color.primary, paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={color.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.followingFeedTitle', 'Following')}</Text>
        <View style={styles.backButton} />
      </View>
      {feed.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color={color.subText} />
          <Text style={[styles.emptyText, { color: color.subText }]}>
            No completed tours from your friends yet.
          </Text>
          <Text style={[styles.emptySubtext, { color: color.subText }]}>
            Follow more users to see their completed tours here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={feed}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && feed.length > 0 ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : null
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}