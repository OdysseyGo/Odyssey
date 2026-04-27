import {
  View,
  ScrollView,
  Text,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TourScrollerComp from '@/components/TourComponents/TourScrollerComp';
import FeaturedTourCarousel from '@/components/TourComponents/FeaturedTourCarousel';
import { getTours, Tour } from '@/api/tours';
import { TourDisplayProps } from '@/components/TourComponents/TourDisplayComp.config';
import { useFocusEffect, router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import Colors from '@/constants/Colors';
import CreateTourButton from '@/components/TourCreation/CreateTourButton';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function mapTourToDisplayProps(tour: Tour, t: (key: string) => string): TourDisplayProps {
  return {
    id: tour.id.toString(),
    image: tour.steps?.[0]?.image || '',
    title: tour.title,
    author: tour.creator?.username || 'Unknown',
    duration: `${tour.duration_minutes} ${t('tourId.min')}`,
    length: tour.steps?.length ? `${tour.steps.length} ${t('tourId.stops')}` : 'N/A',
    reviewCount: `${tour.reviews?.length || 0} ${t('tourId.review')}`,
    rating: tour.average_rating?.toFixed(1) || '0',
    city: tour.city,
  };
}

const continentKeyMap: Record<string, string> = {
  Europe: 'tour.continents.europe',
  Asia: 'tour.continents.asia',
  'North America': 'tour.continents.northAmerica',
  'South America': 'tour.continents.southAmerica',
  Africa: 'tour.continents.africa',
  Oceania: 'tour.continents.oceania',
  Antarctica: 'tour.continents.antarctica',
  Other: 'tour.continents.other',
};

const CONTINENT_ICONS: Record<string, string> = {
  Europe: 'business',
  Asia: 'leaf',
  'North America': 'flag',
  'South America': 'water',
  Africa: 'sunny',
  Oceania: 'earth',
  Antarctica: 'snow',
  Other: 'help-circle-outline',
};

// ─────────────────────────────────────────────────────────
// Skeleton shimmer block
// ─────────────────────────────────────────────────────────

function ShimmerBlock({
  width,
  height,
  borderRadius = 14,
  style,
  color,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  color: string;
}) {
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
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton loading screen
// ─────────────────────────────────────────────────────────

function SkeletonLoading({ theme }: { theme: (typeof Colors)['light'] }) {
  const shimmerColor = theme.foregroundSecondary;
  const cardW = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Skeleton header */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: 8 }}>
        <ShimmerBlock width={130} height={14} color={shimmerColor} />
        <ShimmerBlock width={190} height={28} borderRadius={8} color={shimmerColor} />
      </View>

      {/* Skeleton carousel */}
      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.xl }}>
        <ShimmerBlock width="100%" height={260} borderRadius={24} color={shimmerColor} />
      </View>

      {/* Skeleton pills */}
      <View
        style={{
          flexDirection: 'row',
          gap: Spacing.sm,
          paddingHorizontal: Spacing.xl,
          marginTop: Spacing.xl,
        }}
      >
        {[70, 90, 80, 85, 75].map((w, i) => (
          <ShimmerBlock key={i} width={w} height={36} borderRadius={999} color={shimmerColor} />
        ))}
      </View>

      {/* Skeleton section header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.xl,
          marginTop: Spacing.xl,
        }}
      >
        <ShimmerBlock width={120} height={20} color={shimmerColor} />
        <ShimmerBlock width={30} height={20} borderRadius={999} color={shimmerColor} />
      </View>

      {/* Skeleton cards */}
      <View
        style={{
          flexDirection: 'row',
          gap: Spacing.md,
          paddingHorizontal: Spacing.xl,
          marginTop: Spacing.md,
        }}
      >
        <ShimmerBlock width={cardW} height={235} borderRadius={22} color={shimmerColor} />
        <ShimmerBlock width={cardW} height={235} borderRadius={22} color={shimmerColor} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

export default function TourDisplay() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Tracks the rendered height of the floating header so scroll content starts below it
  const [headerHeight, setHeaderHeight] = useState(insets.top + 130);

  const hasFetchedRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedCategory]);

  const fetchTours = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (!hasFetchedRef.current) setLoading(true);
      setError(null);
      const response = await getTours({ page_size: 50 });
      setAllTours(response.results);
      hasFetchedRef.current = true;
    } catch (err: any) {
      if (!hasFetchedRef.current) setError(err.message || 'Failed to load tours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTours();
    }, [fetchTours])
  );

  // ─── Continent logic ──────────────────────────────────

  const getContinentFromCoordinates = (lat: number, lon: number): string => {
    if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) return 'Africa';
    if (lat >= 36 && lat <= 71 && lon >= -25 && lon <= 40) return 'Europe';
    if (lat >= -10 && lat <= 77 && lon >= 40 && lon <= 180) return 'Asia';
    if (lat >= 15 && lat <= 72 && lon >= -168 && lon <= -52) return 'North America';
    if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) return 'South America';
    if (lat >= -47 && lat <= -10 && lon >= 110 && lon <= 180) return 'Oceania';
    if (lat < -60) return 'Antarctica';
    return 'Other';
  };

  const getContinent = (tour: Tour): string => {
    if (tour.steps && tour.steps.length > 0) {
      const firstStep = tour.steps[0];
      const lat = parseFloat(firstStep.latitude);
      const lon = parseFloat(firstStep.longitude);
      if (!isNaN(lat) && !isNaN(lon)) return getContinentFromCoordinates(lat, lon);
    }
    return 'Other';
  };

  // ─── Computed data ────────────────────────────────────

  const { featuredTours, popularTours, toursByContinent } = useMemo(() => {
    const tours = allTours;

    const featured = [...tours]
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, 5);

    const popular = [...tours]
      .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
      .slice(0, 10);

    const byContinent: Record<string, Tour[]> = {};
    tours.forEach((tour) => {
      const continent = getContinent(tour);
      if (!byContinent[continent]) byContinent[continent] = [];
      byContinent[continent].push(tour);
    });

    const continentOrder = [
      'Europe',
      'Asia',
      'North America',
      'South America',
      'Africa',
      'Oceania',
      'Other',
    ];
    const sortedContinents = Object.entries(byContinent).sort(
      ([a], [b]) => continentOrder.indexOf(a) - continentOrder.indexOf(b)
    );

    return {
      featuredTours: featured.map((tour) => mapTourToDisplayProps(tour, t)),
      popularTours: popular.map((tour) => mapTourToDisplayProps(tour, t)),
      toursByContinent: sortedContinents.map(([continent, continentTours]) => ({
        continent,
        tours: continentTours.map((tour) => mapTourToDisplayProps(tour, t)),
      })),
    };
  }, [allTours, t]);

  const categories: { key: string; label: string; icon: string }[] = useMemo(
    () => [
      { key: 'all', label: t('tour.all', { defaultValue: 'All' }), icon: 'compass' },
      { key: 'popular', label: t('tour.popular'), icon: 'flame' },
      ...toursByContinent.map(({ continent }) => ({
        key: continent,
        label: t(continentKeyMap[continent] ?? 'tour.continents.other', {
          defaultValue: continent,
        }),
        icon: CONTINENT_ICONS[continent] ?? 'location-outline',
      })),
    ],
    [toursByContinent, t]
  );

  const onRefresh = useCallback(() => fetchTours(true), [fetchTours]);

  // ─── Loading state — skeleton ─────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + Spacing.sm }}>
        <SkeletonLoading theme={theme} />
      </View>
    );
  }

  // ─── Error state ──────────────────────────────────────

  if (error) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.background }]}>
        <View style={[styles.errorCard, { backgroundColor: theme.foreground }]}>
          <View style={[styles.errorIconWrap, { backgroundColor: `${theme.error}15` }]}>
            <Ionicons name="cloud-offline-outline" size={40} color={theme.error} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            {t('tour.errorTitle', { defaultValue: 'Something went wrong' })}
          </Text>
          <Text style={[styles.errorMessage, { color: theme.subText }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => fetchTours()}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={theme.white} />
            <Text style={styles.retryText}>{t('tour.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Content ──────────────────────────────────────────

  const showFeatured = selectedCategory === 'all';
  const showPopular = selectedCategory === 'all' || selectedCategory === 'popular';
  const shownContinents =
    selectedCategory === 'all'
      ? toursByContinent
      : selectedCategory === 'popular'
        ? []
        : toursByContinent.filter(({ continent }) => continent === selectedCategory);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* ─── Main scroll — fills the full screen ─────────── */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom + 80 }}
      >
        {/* ─── Hero Carousel ─────────────────────────────── */}
        {featuredTours.length > 0 && showFeatured && (
          <FeaturedTourCarousel tours={featuredTours} autoPlayInterval={5000} />
        )}

        {/* ─── Popular Tours ─────────────────────────────── */}
        {showPopular && popularTours.length > 0 && (
          <TourScrollerComp
            title={t('tour.popular')}
            data={popularTours}
            accentColor={theme.primary}
          />
        )}

        {/* ─── Continent Sections ────────────────────────── */}
        {shownContinents.map(({ continent, tours }, index) => (
          <TourScrollerComp
            key={continent}
            title={t(continentKeyMap[continent] ?? 'tour.continents.other', {
              defaultValue: continent,
            })}
            data={tours}
            accentColor={index % 2 === 0 ? theme.secondary : theme.primary}
          />
        ))}

        {/* ─── Empty state ───────────────────────────────── */}
        {!showPopular && shownContinents.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: `${theme.primary}12` }]}>
              <Ionicons name="map-outline" size={38} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t('tour.emptyTitle', { defaultValue: 'No tours here yet' })}
            </Text>
            <Text style={[styles.emptySubText, { color: theme.subText }]}>
              {t('tour.emptySubtitle', {
                defaultValue: 'Be the first to create a tour in this region!',
              })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ─── Floating blurred header ─────────────────────── */}
      <BlurView
        intensity={90}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={[styles.blurHeader, { paddingTop: insets.top }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        {/* Title row */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerEyebrow, { color: theme.primary }]}>
              {t('tour.headerEyebrow', { defaultValue: 'Ready to explore?' })}
            </Text>
            <Text style={[styles.headerHeadline, { color: theme.text }]}>
              {t('tour.headerTitle', { defaultValue: 'Discover Tours' })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: theme.foregroundSecondary }]}
            activeOpacity={0.7}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          style={{ flexShrink: 0, flexGrow: 0 }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.75}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isActive ? theme.primary : theme.foregroundSecondary,
                    borderWidth: isActive ? 0 : StyleSheet.hairlineWidth,
                    borderColor: theme.borderLight,
                    ...(isActive
                      ? Platform.select({
                          ios: {
                            shadowColor: theme.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                          },
                          android: { elevation: 6 },
                        })
                      : {}),
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? theme.white : theme.subText}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isActive ? theme.white : theme.subText },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BlurView>

      <CreateTourButton />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const createStyles = (theme: (typeof Colors)['light']) =>
  StyleSheet.create({
    centerScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },

    // ─── Blur header wrapper
    blurHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
      backgroundColor: theme.background + 'CC', // ~80% opaque backing for legibility
    },
    // ─── Header row
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingTop: Math.max(Spacing.xs, SCREEN_HEIGHT * 0.006),
      paddingBottom: Math.max(Spacing.xs, SCREEN_HEIGHT * 0.006),
    },
    headerEyebrow: {
      fontSize: Math.min(Math.max(11, SCREEN_HEIGHT * 0.015), 14),
      fontWeight: '600',
      letterSpacing: 0.2,
      marginBottom: 1,
    },
    headerHeadline: {
      fontSize: Math.min(Math.max(18, SCREEN_HEIGHT * 0.026), 26),
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    headerIconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
      }),
    },

    // ─── Category pills
    categoryRow: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Math.max(Spacing.sm, SCREEN_HEIGHT * 0.008),
      paddingBottom: Math.max(Spacing.sm, SCREEN_HEIGHT * 0.008),
      gap: Spacing.sm,
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Spacing.borderRadiusFull,
    },
    categoryPillText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.1,
    },

    // ─── Error
    errorCard: {
      alignItems: 'center',
      padding: Spacing.xxl,
      borderRadius: 26,
      gap: Spacing.md,
      maxWidth: 300,
      ...Platform.select({
        ios: {
          shadowColor: theme.text,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
        },
        android: { elevation: 8 },
      }),
    },
    errorIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    errorMessage: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadiusFull,
      marginTop: Spacing.xs,
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    retryText: {
      color: theme.white,
      fontSize: 15,
      fontWeight: '700',
    },

    // ─── Empty state
    emptyState: {
      alignItems: 'center',
      padding: Spacing.xxl,
      gap: Spacing.md,
      marginTop: Spacing.xxl,
    },
    emptyIconWrap: {
      width: 84,
      height: 84,
      borderRadius: 42,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    emptyTitle: {
      fontSize: 19,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    emptySubText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 240,
    },
  });
