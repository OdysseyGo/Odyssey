// app/tour/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';

import {
  TourDetailCover,
  TourDetailStats,
  TourDetailAuthor,
  TourDetailDescription,
  TourDetailMap,
  TourDetailStops,
  TourDetailBottomBar,
  TourDetail,
  TourStop,
} from '@/components/TourDetailComponents';
import { getTour, Tour } from '@/api/tours';

// Map API Tour to component TourDetail type
function mapApiTourToDetail(tour: Tour): TourDetail {
  const stops: TourStop[] = (tour.steps || []).map((step) => ({
    id: step.id.toString(),
    title: step.title,
    description: step.description,
    latitude: parseFloat(step.latitude),
    longitude: parseFloat(step.longitude),
    order: step.order,
  }));

  const difficultyMap: Record<string, TourDetail['difficulty']> = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
  };

  return {
    id: tour.id.toString(),
    title: tour.title,
    description: tour.description,
    author: tour.creator?.username || 'Unknown',
    authorAvatar: `https://picsum.photos/100/100?random=${tour.creator?.id || tour.id}`,
    coverImage: tour.steps?.[0]?.image || `https://picsum.photos/800/400?random=${tour.id}`,
    duration: `${tour.duration_minutes} min`,
    distance:
      tour.total_distance != null && tour.total_distance > 0
        ? `${(tour.total_distance / 1000).toFixed(1)} km`
        : 'N/A',
    rating: tour.average_rating || 0.0,
    reviewCount: tour.reviews?.length || 0,
    difficulty: difficultyMap[tour.difficulty] || 'Medium',
    stops,
    tags: [tour.category, tour.tour_type, tour.city].filter(Boolean),
  };
}

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useColorTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = Colors[theme];

  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const tourData = await getTour(parseInt(id, 10));
      setTour(mapApiTourToDetail(tourData));
    } catch (err: any) {
      setError(err.message || 'Failed to load tour');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  const handleStartTour = () => {
    console.log('Starting tour:', id);
    // TODO: Navigate to tour navigation mode
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading tour...</Text>
        </View>
      </>
    );
  }

  if (error || !tour) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={[styles.container, styles.centered]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || 'Tour not found'}
          </Text>
          <Text style={[styles.retryText, { color: colors.primary }]} onPress={fetchTour}>
            Tap to retry
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: tour.title,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TourDetailCover
          coverImage={tour.coverImage}
          title={tour.title}
          rating={tour.rating}
          reviewCount={tour.reviewCount}
        />

        <View style={styles.content}>
          <TourDetailStats
            duration={tour.duration}
            distance={tour.distance}
            difficulty={tour.difficulty}
          />

          <TourDetailAuthor authorAvatar={tour.authorAvatar} authorName={tour.author} />

          <TourDetailDescription description={tour.description} tags={tour.tags} />

          <TourDetailMap stops={tour.stops} />

          <TourDetailStops stops={tour.stops} />

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <TourDetailBottomBar onStartTour={handleStartTour} />
    </>
  );
}

const createStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    content: {
      padding: Spacing.lg,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: 16,
    },
    errorText: {
      marginTop: Spacing.md,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
    },
    retryText: {
      marginTop: Spacing.md,
      fontSize: 16,
      fontWeight: '600',
    },
  });
};
