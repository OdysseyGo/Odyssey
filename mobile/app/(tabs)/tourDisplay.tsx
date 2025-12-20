import { View, ScrollView, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import TourScrollerComp from '@/components/TourComponents/TourScrollerComp';
import FeaturedTourCarousel from '@/components/TourComponents/FeaturedTourCarousel';
import { getTours, Tour } from '@/api/tours';
import { TourDisplayProps } from '@/components/TourComponents/TourDisplayComp.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import Colors from '@/constants/Colors';

// Convert API Tour to TourDisplayProps for components
function mapTourToDisplayProps(tour: Tour): TourDisplayProps {
  return {
    id: tour.id.toString(),
    image: tour.steps?.[0]?.image || `https://picsum.photos/400/320?random=${tour.id}`,
    title: tour.title,
    author: tour.creator?.username || 'Unknown',
    duration: `${tour.duration_minutes} min`,
    length: tour.steps?.length ? `${tour.steps.length} stops` : 'N/A',
    reviewCount: `${tour.reviews?.length || 0} reviews`,
    rating: tour.average_rating?.toFixed(1) || 'N/A',
  };
}

export default function TourDisplay() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tours
  const fetchTours = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await getTours({ page_size: 50 });
      setAllTours(response.results);
    } catch (err: any) {
      setError(err.message || 'Failed to load tours');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  // Organize tours by categories
  const { featuredTours, popularTours, toursByCity } = useMemo(() => {
    const tours = allTours;

    // Featured: top-rated tours
    const featured = [...tours]
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, 5);

    // Popular: most reviewed
    const popular = [...tours]
      .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
      .slice(0, 10);

    // Group by city
    const byCity: Record<string, Tour[]> = {};
    tours.forEach((tour) => {
      const city = tour.city || 'Other';
      if (!byCity[city]) byCity[city] = [];
      byCity[city].push(tour);
    });

    return {
      featuredTours: featured.map(mapTourToDisplayProps),
      popularTours: popular.map(mapTourToDisplayProps),
      toursByCity: Object.entries(byCity).map(([city, cityTours]) => ({
        city,
        tours: cityTours.map(mapTourToDisplayProps),
      })),
    };
  }, [allTours]);

  const onRefresh = useCallback(() => {
    fetchTours(true);
  }, [fetchTours]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: Spacing.md, color: theme.text }}>Loading tours...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background,
          padding: Spacing.xl,
        }}
      >
        <Ionicons name="alert-circle-outline" size={48} color={theme.icon} />
        <Text style={{ marginTop: Spacing.md, color: theme.text, textAlign: 'center' }}>
          {error}
        </Text>
        <Text
          style={{ marginTop: Spacing.md, color: theme.primary, fontWeight: '600' }}
          onPress={() => fetchTours()}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Featured Carousel */}
        {featuredTours.length > 0 && (
          <FeaturedTourCarousel tours={featuredTours} autoPlayInterval={5000} />
        )}

        {/* Popular Tours */}
        {popularTours.length > 0 && <TourScrollerComp title="Popular Tours" data={popularTours} />}

        {/* Tours by City */}
        {toursByCity.map(({ city, tours }) => (
          <TourScrollerComp key={city} title={city} data={tours} />
        ))}
      </ScrollView>
      <CreateTourButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
