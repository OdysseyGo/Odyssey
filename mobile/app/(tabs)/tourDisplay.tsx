import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import TourScrollerComp from '@/components/TourComponents/TourScrollerComp';
import FeaturedTourCarousel from '@/components/TourComponents/FeaturedTourCarousel';
import { getTours, Tour } from '@/api/tours';
import { TourDisplayProps } from '@/components/TourComponents/TourDisplayComp.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import Colors from '@/constants/Colors';
import CreateTourButton from '@/components/TourCreation/CreateTourButton';

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
    rating: tour.average_rating?.toFixed(1) || '0',
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

  // Determine continent from coordinates (latitude, longitude)
  const getContinentFromCoordinates = (lat: number, lon: number): string => {
    // Africa
    if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) {
      return 'Africa';
    }
    // Europe
    if (lat >= 36 && lat <= 71 && lon >= -25 && lon <= 40) {
      return 'Europe';
    }
    // Asia
    if (lat >= -10 && lat <= 77 && lon >= 40 && lon <= 180) {
      return 'Asia';
    }
    // North America
    if (lat >= 15 && lat <= 72 && lon >= -168 && lon <= -52) {
      return 'North America';
    }
    // South America
    if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) {
      return 'South America';
    }
    // Oceania
    if (lat >= -47 && lat <= -10 && lon >= 110 && lon <= 180) {
      return 'Oceania';
    }
    // Antarctica
    if (lat < -60) {
      return 'Antarctica';
    }
    return 'Other';
  };

  const getContinent = (tour: Tour): string => {
    // Use the first step's coordinates to determine continent
    if (tour.steps && tour.steps.length > 0) {
      const firstStep = tour.steps[0];
      const lat = parseFloat(firstStep.latitude);
      const lon = parseFloat(firstStep.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        return getContinentFromCoordinates(lat, lon);
      }
    }
    return 'Other';
  };

  // Organize tours by categories
  const { featuredTours, popularTours, toursByContinent } = useMemo(() => {
    const tours = allTours;

    // Featured: top-rated tours
    const featured = [...tours]
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, 5);

    // Popular: most reviewed
    const popular = [...tours]
      .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
      .slice(0, 10);

    // Group by continent
    const byContinent: Record<string, Tour[]> = {};
    tours.forEach((tour) => {
      const continent = getContinent(tour);
      if (!byContinent[continent]) byContinent[continent] = [];
      byContinent[continent].push(tour);
    });

    // Sort continents in a logical order
    const continentOrder = ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania', 'Other'];
    const sortedContinents = Object.entries(byContinent).sort(([a], [b]) => {
      return continentOrder.indexOf(a) - continentOrder.indexOf(b);
    });

    return {
      featuredTours: featured.map(mapTourToDisplayProps),
      popularTours: popular.map(mapTourToDisplayProps),
      toursByContinent: sortedContinents.map(([continent, continentTours]) => ({
        continent,
        tours: continentTours.map(mapTourToDisplayProps),
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

        {/* Tours by Continent */}
        {toursByContinent.map(({ continent, tours }) => (
          <TourScrollerComp key={continent} title={continent} data={tours} />
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
