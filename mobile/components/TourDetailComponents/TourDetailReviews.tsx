import { View, Text, Image, Animated, ActivityIndicator } from 'react-native';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { getTourReviews } from '@/api/tours';
import { TourDetailReviewsProps, TourDetailReviewsState } from './TourDetailReviews.config';
import { tourDetailReviewsStyles } from './TourDetailReviews.styles';

const STAR_SIZE = 14;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

function StarRating({ rating, color }: { rating: number; color: string }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map((filled, i) => (
        <Ionicons key={i} name={filled ? 'star' : 'star-outline'} size={STAR_SIZE} color={color} />
      ))}
    </View>
  );
}

function ReviewSkeletonLoader({ color }: { color: string }) {
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
    <View style={{ gap: 8 }}>
      {[...Array(3)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            {
              height: 100,
              borderRadius: 12,
              backgroundColor: color,
              opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function TourDetailReviews({ tourId }: TourDetailReviewsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailReviewsStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  const [state, setState] = useState<TourDetailReviewsState>({
    reviews: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await getTourReviews(tourId);

        // Handle both array and wrapped responses
        const reviewsArray = Array.isArray(response) ? response : (response as any)?.results || [];

        setState({ reviews: reviewsArray, loading: false, error: null });
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load reviews',
        }));
      }
    };

    fetchReviews();
  }, [tourId]);

  if (state.loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('tourDetail.reviews')}</Text>
        <View style={styles.loadingContainer}>
          <ReviewSkeletonLoader color={colors.foregroundSecondary} />
        </View>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('tourDetail.reviews')}</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.subText} />
          </View>
          <Text style={styles.emptyText}>{state.error}</Text>
        </View>
      </View>
    );
  }

  if (state.reviews.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('tourDetail.reviews')}</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubble-outline" size={32} color={colors.subText} />
          </View>
          <Text style={styles.emptyText}>{t('tourDetail.noReviews')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('tourDetail.reviews')}</Text>
        <View style={styles.reviewCountBadge}>
          <Text style={styles.reviewCount}>{state.reviews.length}</Text>
        </View>
      </View>

      <View style={styles.reviewList}>
        {state.reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                {review.user.avatar_url ? (
                  <Image source={{ uri: review.user.avatar_url }} style={styles.reviewerAvatar} />
                ) : (
                  <View
                    style={[
                      styles.reviewerAvatar,
                      {
                        backgroundColor: colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Ionicons name="person" size={20} color={colors.white} />
                  </View>
                )}
                <View style={styles.reviewerDetails}>
                  <View style={styles.reviewerNameRow}>
                    <Text style={styles.reviewerName}>
                      {review.user.first_name + ' ' + review.user.last_name}
                    </Text>
                    <Text style={styles.reviewerUsername}>{'@' + review.user.username}</Text>
                  </View>
                  <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                <StarRating rating={review.rating} color={colors.primary} />
              </View>
            </View>

            {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}
