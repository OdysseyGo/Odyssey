import { Alert, View, Text, Image, Animated, TouchableOpacity } from 'react-native';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { isLoggedIn } from '@/api/auth';
import { getTourReviews } from '@/api/tours';
import { ReportCategory, submitReport } from '@/api/reports';
import ReportContentModal from '@/components/common/ReportContentModal';
import { TourDetailReviewsProps, TourDetailReviewsState } from './TourDetailReviews.config';
import { tourDetailReviewsStyles } from './TourDetailReviews.styles';

const STAR_SIZE = 14;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const millisecondsPerDay = MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / millisecondsPerDay);

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < DAYS_PER_WEEK) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < DAYS_PER_MONTH) {
    const weeks = Math.floor(diffInDays / DAYS_PER_WEEK);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays < DAYS_PER_YEAR) {
    const months = Math.floor(diffInDays / DAYS_PER_MONTH);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInDays / DAYS_PER_YEAR);
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
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
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
    requiresLogin: false,
  });
  const [reportReviewId, setReportReviewId] = useState<number | null>(null);
  const [reportCategory, setReportCategory] = useState<ReportCategory>('INAPPROPRIATE');
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const handleCloseReport = () => {
    if (reportSubmitting) return;
    setReportReviewId(null);
  };

  const handleSubmitReport = async () => {
    if (!reportReviewId || reportSubmitting) return;
    const reason = reportReason.trim();
    if (reportCategory === 'OTHER' && reason.length < 3) return;

    try {
      setReportSubmitting(true);
      await submitReport({
        content_type: 'REVIEW',
        content_id: reportReviewId,
        category: reportCategory,
        reason,
      });
      setReportReviewId(null);
      setReportCategory('INAPPROPRIATE');
      setReportReason('');
      Alert.alert(
        t('report.successTitle', { defaultValue: 'Report submitted' }),
        t('report.successMessage', {
          defaultValue: 'Thanks for helping keep Odyssey safe. Our team will review it.',
        })
      );
    } catch (err: any) {
      Alert.alert(
        t('report.errorTitle', { defaultValue: 'Could not submit report' }),
        err?.message ||
          t('report.errorMessage', {
            defaultValue: 'Please check your connection and try again.',
          })
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
          setState({
            reviews: [],
            loading: false,
            error: null,
            requiresLogin: true,
          });
          return;
        }

        const response = await getTourReviews(tourId);

        // Handle both array and wrapped responses
        const reviewsArray = Array.isArray(response) ? response : (response as any)?.results || [];

        setState({ reviews: reviewsArray, loading: false, error: null, requiresLogin: false });
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load reviews',
          requiresLogin: false,
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

  if (state.requiresLogin) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('tourDetail.reviews')}</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.subText} />
          </View>
          <Text style={styles.emptyText}>
            {t('tourDetail.loginToViewReviews', 'Log in to view reviews.')}
          </Text>
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
                <TouchableOpacity
                  onPress={() => setReportReviewId(review.id)}
                  style={styles.reportReviewButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('report.reviewButton', { defaultValue: 'Report review' })}
                >
                  <Ionicons name="flag-outline" size={16} color={colors.subText} />
                </TouchableOpacity>
              </View>
            </View>

            {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
          </View>
        ))}
      </View>

      <ReportContentModal
        visible={reportReviewId !== null}
        title={t('report.reviewTitle', { defaultValue: 'Report review' })}
        subtitle={t('report.subtitle', {
          defaultValue: 'Choose the closest reason, then add details so our team can review it.',
        })}
        category={reportCategory}
        reason={reportReason}
        submitting={reportSubmitting}
        onChangeCategory={setReportCategory}
        onChangeReason={setReportReason}
        onClose={handleCloseReport}
        onSubmit={handleSubmitReport}
      />
    </View>
  );
}
