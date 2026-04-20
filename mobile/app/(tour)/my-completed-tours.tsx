import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import ProfileTourCard from '@/components/ProfileComponents/ProfileTourCard';
import { addTourReview, getMyCompletedTours, Tour, Review, updateTourReview } from '@/api/tours';
import { getCurrentUser } from '@/api/auth';
import { User } from '@/api/users';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

type CompletedTourStatus = 'PUBLISHED' | 'ARCHIVED';

const TOUR_TABS: { key: CompletedTourStatus; label: string }[] = [
  { key: 'PUBLISHED', label: 'profile.tabs.published' },
  { key: 'ARCHIVED', label: 'profile.tabs.archived' },
];

export default function MyCompletedToursScreen() {
  const [activeTab, setActiveTab] = useState<CompletedTourStatus>('PUBLISHED');
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  const fetchTours = useCallback(async (status: CompletedTourStatus) => {
    setLoading(true);
    setFetchError(false);
    try {
      const response = await getMyCompletedTours(status);
      setTours(response.results);
    } catch (error) {
      console.error('Failed to fetch completed tours:', error);
      setFetchError(true);
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTours(activeTab);
      let mounted = true;
      (async () => {
        const me = await getCurrentUser();
        if (mounted) setCurrentUser(me);
      })();
      return () => {
        mounted = false;
      };
    }, [activeTab, retryKey, fetchTours])
  );

  const handleTabChange = (tab: CompletedTourStatus) => {
    setActiveTab(tab);
  };

  const getUserReview = (tour: Tour): Review | undefined => {
    return tour.reviews?.find((review) => review.user?.id === currentUser?.id);
  };

  const openReviewModal = (tour: Tour) => {
    const userReview = getUserReview(tour) ?? null;
    setSelectedTour(tour);
    setSelectedReview(userReview);
    setReviewRating(userReview ? userReview.rating : 5); // Use number directly
    setReviewComment(userReview ? userReview.comment : '');
    setReviewModalVisible(true);
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedTour(null);
    setSelectedReview(null);
    setReviewComment('');
    setReviewRating(5);
  };

  const submitReview = async () => {
    if (!selectedTour) return;

    setReviewSubmitting(true);
    try {
      if (selectedReview) {
        await updateTourReview(selectedTour.id, selectedReview.id, {
          rating: reviewRating, // Use the number state directly
          comment: reviewComment.trim(),
        });
      } else {
        await addTourReview(selectedTour.id, {
          rating: reviewRating, // Use the number state directly
          comment: reviewComment.trim(),
        });
      }

      Alert.alert(
        t('profile.reviewSuccessTitle', { defaultValue: 'Review submitted' }),
        t('profile.reviewSuccessMessage', { defaultValue: 'Thank you for your feedback!' })
      );
      closeReviewModal();
      fetchTours(activeTab);
    } catch (error) {
      console.error('Failed to submit review:', error);
      Alert.alert(
        t('profile.reviewErrorTitle', { defaultValue: 'Could not submit review' }),
        t('profile.reviewErrorMessage', { defaultValue: 'Please try again later.' })
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'PUBLISHED':
        return t('profile.emptyCompletedTour', { defaultValue: 'No published tours yet' });
      case 'ARCHIVED':
        return t('profile.emptyCompletedTour', { defaultValue: 'No archived tours yet' });
      default:
        return t('profile.emptyCompletedTour', { defaultValue: 'No tours found' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* ─── Header ──────────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: theme.primary, opacity: headerOpacity },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('profile.completedTours', { defaultValue: 'Completed Tours' })}
          </Text>
          <View style={{ width: 28 }} />
        </View>
      </Animated.View>

      {/* ─── Tabs ────────────────────────────────── */}
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: theme.background, borderBottomColor: theme.foregroundSecondary },
        ]}
      >
        {TOUR_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.tabActive, { borderBottomColor: theme.primary }],
            ]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.text },
                activeTab === tab.key && [styles.tabTextActive, { color: theme.primary }],
              ]}
            >
              {t(tab.label)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Content ─────────────────────────────── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : fetchError ? (
        <View style={styles.centerContainer}>
          <View style={[styles.errorCard, { backgroundColor: theme.cardSurface }]}>
            <View style={[styles.errorIconWrap, { backgroundColor: `${theme.error}12` }]}>
              <Ionicons name="alert-circle-outline" size={36} color={theme.error} />
            </View>
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              {t('profile.errorTitle', { defaultValue: 'Something went wrong' })}
            </Text>
            <Text style={[styles.errorSubtitle, { color: theme.subText }]}>
              {t('profile.errorMessage', {
                defaultValue: "We couldn't load your tours. Please try again.",
              })}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => setRetryKey((k) => k + 1)}
            >
              <Text style={styles.retryButtonText}>
                {t('common.retry', { defaultValue: 'Try Again' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : tours.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="map-outline" size={48} color={theme.subText} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyStateText, { color: theme.subText }]}>{getEmptyMessage()}</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={tours}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const userReview = currentUser ? getUserReview(item) : null;
            return (
              <View style={[styles.tourItem, { backgroundColor: theme.cardSurface }]}>
                <ProfileTourCard
                  tour={item}
                  containerStyle={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                />
                {item.status === 'PUBLISHED' ? (
                  <TouchableOpacity
                    style={[styles.reviewButton, { backgroundColor: theme.primary }]}
                    activeOpacity={0.8}
                    onPress={() => openReviewModal(item)}
                  >
                    <Text style={styles.reviewButtonText}>
                      {userReview
                        ? t('profile.editReview', { defaultValue: 'Edit Review' })
                        : t('profile.reviewTour', { defaultValue: 'Review Tour' })}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardSurface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('profile.leaveReview', { defaultValue: 'Leave a Review' })}
            </Text>
            <Text style={[styles.modalLabel, { color: theme.subText }]}>
              {t('profile.reviewRatingLabel', { defaultValue: 'Rating (1-5)' })}
            </Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={36}
                    color={theme.primary} // or use a gold color like '#FFD700' if you prefer
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.modalLabel, { color: theme.subText }]}>
              {t('profile.reviewCommentLabel', { defaultValue: 'Comment' })}
            </Text>
            <TextInput
              value={reviewComment}
              onChangeText={(value) => setReviewComment(value.slice(0, 200))}
              placeholder={t('profile.reviewCommentPlaceholder', {
                defaultValue: 'Write up to 200 characters',
              })}
              placeholderTextColor={theme.subText}
              multiline
              maxLength={200}
              style={[
                styles.textArea,
                { color: theme.text, borderColor: theme.foregroundSecondary },
              ]}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton]}
                onPress={closeReviewModal}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={submitReview}
                disabled={reviewSubmitting}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {reviewSubmitting
                    ? t('common.submitting', { defaultValue: 'Submitting...' })
                    : t('common.submit', { defaultValue: 'Submit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  tabsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    // Color set dynamically in JSX
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
  tabTextActive: {
    opacity: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },

  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.md,
    textAlign: 'center',
  },

  errorCard: {
    padding: Spacing.xxl,
    borderRadius: 24,
    alignItems: 'center',
    gap: Spacing.md,
    maxWidth: 320,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.sm,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadiusFull,
    marginTop: Spacing.md,
  },
  reviewButton: {
    width: '100%',
    marginTop: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tourItem: {
    borderRadius: 16,
    overflow: 'hidden',
    gap: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    marginTop: Spacing.xs,
  },
  textArea: {
    width: '100%',
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    marginTop: Spacing.xs,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: Spacing.borderRadiusFull,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm, // Or use marginHorizontal on starButton if gap isn't supported in your RN version
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  starButton: {
    padding: 2, // Gives a slightly larger tap target
  },
});
