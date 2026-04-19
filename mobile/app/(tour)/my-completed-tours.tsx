import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import ProfileTourCard from '@/components/ProfileComponents/ProfileTourCard';
import { getMyCompletedTours, Tour, TourStatus } from '@/api/tours';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

type CompletedTourStatus = 'PUBLISHED' | 'ARCHIVED';

const TOUR_TABS: Array<{ key: CompletedTourStatus; label: string }> = [
  { key: 'PUBLISHED', label: 'profile.tabs.published' },
  { key: 'ARCHIVED', label: 'profile.tabs.archived' },
];

export default function MyCompletedToursScreen() {
  const [activeTab, setActiveTab] = useState<CompletedTourStatus>('PUBLISHED');
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

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
    }, [activeTab, retryKey, fetchTours])
  );

  const handleTabChange = (tab: CompletedTourStatus) => {
    setActiveTab(tab);
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
      <Animated.View style={[styles.header,{ paddingTop: insets.top, backgroundColor: theme.primary, opacity: headerOpacity,
          },
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
      <View style={[styles.tabsContainer, { backgroundColor: theme.background, borderBottomColor: theme.foregroundSecondary }]}>
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
          <Text style={[styles.emptyStateText, { color: theme.subText }]}>
            {getEmptyMessage()}
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={tours}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProfileTourCard tour={item} />}
          contentContainerStyle={styles.listContent}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
