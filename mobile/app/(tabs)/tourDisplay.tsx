import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TourScrollerComp from '@/components/TourComponents/TourScrollerComp';
import FeaturedTourCarousel from '@/components/TourComponents/FeaturedTourCarousel';
import { getTours, Tour } from '@/api/tours';
import { TourDisplayProps } from '@/components/TourComponents/TourDisplayComp.config';
import { useFocusEffect } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import Colors from '@/constants/Colors';
import CreateTourButton from '@/components/TourCreation/CreateTourButton';
import { useTranslation } from 'react-i18next';

function mapTourToDisplayProps(tour: Tour, t: (key: string) => string): TourDisplayProps {
  return {
    id: tour.id.toString(),
    image: tour.steps?.[0]?.image || `https://picsum.photos/400/320?random=${tour.id}`,
    title: tour.title,
    author: tour.creator?.username || 'Unknown',
    duration: `${tour.duration_minutes} ${t('tourId.min')}`,
    length: tour.steps?.length ? `${tour.steps.length} ${t('tourId.stops')}` : 'N/A',
    reviewCount: `${tour.reviews?.length || 0} ${t('tourId.review')}`,
    rating: tour.average_rating?.toFixed(1) || '0',
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

export default function TourDisplay() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchTours = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading((prev) => allTours.length === 0);
      setError(null);
      const response = await getTours({ page_size: 50 });
      setAllTours(response.results);
    } catch (err: any) {
      if (allTours.length === 0) setError(err.message || 'Failed to load tours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [allTours.length]);

  useFocusEffect(
    useCallback(() => {
      fetchTours();
    }, [fetchTours])
  );

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
      { key: 'all', label: 'All', icon: 'compass' },
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

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: theme.foreground }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingTitle, { color: theme.text }]}>{t('tour.loading')}</Text>
          <Text style={[styles.loadingSubText, { color: theme.subText }]}>
            Finding amazing tours for you
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: theme.background }]}>
        <View style={[styles.errorCard, { backgroundColor: theme.foreground }]}>
          <View style={[styles.errorIconWrap, { backgroundColor: `${theme.error}18` }]}>
            <Ionicons name="alert-circle" size={44} color={theme.error} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Oops!</Text>
          <Text style={[styles.errorMessage, { color: theme.subText }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => fetchTours()}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={17} color="#fff" />
            <Text style={styles.retryText}>{t('tour.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
      {/* ─── Page Header ─────────────────────────────────────── */}
      <View
        style={[
          styles.pageHeader,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.borderLight,
            paddingTop: insets.top + Spacing.sm,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerEyebrow, { color: theme.subText }]}>Ready to explore?</Text>
          <Text style={[styles.headerHeadline, { color: theme.text }]}>Discover Tours</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: theme.foreground }]}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ─── Hero Carousel ───────────────────────────────────── */}
        {featuredTours.length > 0 && showFeatured && (
          <FeaturedTourCarousel tours={featuredTours} autoPlayInterval={5000} />
        )}

        {/* ─── Stats Bar ───────────────────────────────────────── */}
        <View
          style={[
            styles.statsBar,
            {
              backgroundColor: theme.foreground,
              borderColor: theme.borderLight,
            },
          ]}
        >
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: `${theme.primary}22` }]}>
              <Ionicons name="map" size={13} color={theme.primary} />
            </View>
            <Text style={[styles.statText, { color: theme.subText }]}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{allTours.length}</Text> tours
            </Text>
          </View>

          <View style={[styles.statSep, { backgroundColor: theme.borderLight }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: `${theme.secondary}22` }]}>
              <Ionicons name="globe" size={13} color={theme.secondary} />
            </View>
            <Text style={[styles.statText, { color: theme.subText }]}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>
                {toursByContinent.length}
              </Text>{' '}
              regions
            </Text>
          </View>

          <View style={[styles.statSep, { backgroundColor: theme.borderLight }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: `${theme.star}22` }]}>
              <Ionicons name="star" size={13} color={theme.star} />
            </View>
            <Text style={[styles.statText, { color: theme.subText }]}>Top picks</Text>
          </View>
        </View>

        {/* ─── Category Filter Pills ───────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.categoryRow}
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
                    backgroundColor: isActive ? theme.primary : theme.foreground,
                    ...(isActive
                      ? {
                          shadowColor: theme.primary,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.38,
                          shadowRadius: 10,
                          elevation: 6,
                        }
                      : {}),
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={15}
                  color={isActive ? '#fff' : theme.subText}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isActive ? '#fff' : theme.subText },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Popular Tours ───────────────────────────────────── */}
        {showPopular && popularTours.length > 0 && (
          <TourScrollerComp title={t('tour.popular')} data={popularTours} accentColor={theme.primary} />
        )}

        {/* ─── Continent Sections ──────────────────────────────── */}
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

        {/* ─── Empty State ─────────────────────────────────────── */}
        {!showPopular && shownContinents.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.foreground }]}>
              <Ionicons name="map-outline" size={40} color={theme.icon} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No tours here yet</Text>
            <Text style={[styles.emptySubText, { color: theme.subText }]}>
              Be the first to create a tour in this region!
            </Text>
          </View>
        )}
      </ScrollView>

      <CreateTourButton />
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Screens
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  // ─── Page Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  headerHeadline: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: 18,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statSep: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    marginHorizontal: Spacing.xs,
  },

  // ─── Category Pills
  categoryRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 3,
    borderRadius: Spacing.borderRadiusFull,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ─── Loading
  loadingCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: 28,
    gap: Spacing.md,
    minWidth: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  loadingSubText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── Error
  errorCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: 28,
    gap: Spacing.md,
    maxWidth: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  errorIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    fontSize: 22,
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
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadiusFull,
    marginTop: Spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Empty State
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
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
