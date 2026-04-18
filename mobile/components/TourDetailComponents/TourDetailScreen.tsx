import { View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { getTour } from '@/api/tours';
import { TourDetail } from './TourDetail.config';
import { TourDetailScreenProps, mapApiTourToDetail } from './TourDetailScreen.config';
import { tourDetailScreenStyles } from './TourDetailScreen.styles';
import TourDetailCover from './TourDetailCover';
import TourDetailStats from './TourDetailStats';
import TourDetailAuthor from './TourDetailAuthor';
import TourDetailDescription from './TourDetailDescription';
import TourDetailMap from './TourDetailMap';
import TourDetailStops from './TourDetailStops';
import TourDetailBottomBar from './TourDetailBottomBar';

interface TourDetailScreenState {
  tour: TourDetail | null;
  loading: boolean;
  error: string | null;
}

interface TourDetailScreenResult extends TourDetailScreenState {
  fetchTour: () => Promise<void>;
}

export function useTourDetailScreen(tourId: string): TourDetailScreenResult {
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTour = useCallback(async () => {
    if (!tourId) return;

    try {
      setLoading(true);
      setError(null);
      const tourData = await getTour(parseInt(tourId, 10));
      setTour(mapApiTourToDetail(tourData));
    } catch (err: any) {
      setError(err.message || 'Failed to load tour');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, loading, error, fetchTour };
}

export interface TourDetailScreenLoadingProps {
  message?: string;
}

export function TourDetailScreenLoading({
  message = 'Loading tour...',
}: TourDetailScreenLoadingProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailScreenStyles(theme), [theme]);
  const colors = Colors[theme];

  return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

export interface TourDetailScreenErrorProps {
  error: string;
  onRetry: () => void;
}

export function TourDetailScreenError({ error, onRetry }: TourDetailScreenErrorProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailScreenStyles(theme), [theme]);
  const colors = Colors[theme];

  return (
    <View style={[styles.container, styles.centered]}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
      <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      <Text style={[styles.retryText, { color: colors.primary }]} onPress={onRetry}>
        Tap to retry
      </Text>
    </View>
  );
}

export interface TourDetailScreenContentProps {
  tour: TourDetail;
  onStartTour: () => void;
}

export function TourDetailScreenContent({ tour, onStartTour }: TourDetailScreenContentProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailScreenStyles(theme), [theme]);

  return (
    <>
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

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <TourDetailBottomBar
        onStartTour={onStartTour}
        creditPrice={tour.creditPrice}
        hasAccess={tour.hasAccess}
      />
    </>
  );
}

export default function TourDetailScreen({ tourId }: TourDetailScreenProps) {
  const { tour, loading, error, fetchTour } = useTourDetailScreen(tourId);

  const handleStartTour = async () => {
    console.log('Starting tour:', tourId);
    // Note: This component is kept for backwards compatibility
    // The main handleStartTour logic is in app/tour/[id].tsx
  };

  if (loading) {
    return <TourDetailScreenLoading />;
  }

  if (error || !tour) {
    return <TourDetailScreenError error={error || 'Tour not found'} onRetry={fetchTour} />;
  }

  return <TourDetailScreenContent tour={tour} onStartTour={handleStartTour} />;
}
