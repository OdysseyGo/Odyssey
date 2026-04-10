import { View, ScrollView, ActivityIndicator, Text, Animated } from 'react-native';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { STAR } from '@/constants/Symbols';
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
  const { t } = useTranslation();

  const fetchTour = useCallback(async () => {
    if (!tourId) return;

    try {
      setLoading(true);
      setError(null);
      const tourData = await getTour(parseInt(tourId, 10));
      setTour(mapApiTourToDetail(tourData, t));
    } catch (err: any) {
      setError(err.message || 'Failed to load tour');
    } finally {
      setLoading(false);
    }
  }, [tourId, t]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, loading, error, fetchTour };
}

export interface TourDetailScreenLoadingProps {
  message?: string;
}

export function TourDetailScreenLoading({ message }: TourDetailScreenLoadingProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailScreenStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.text }]}>
        {message ?? t('tourDetail.loading')}
      </Text>
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
  const { t } = useTranslation();

  return (
    <View style={[styles.container, styles.centered]}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
      <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      <Text style={[styles.retryText, { color: colors.primary }]} onPress={onRetry}>
        {t('tourDetail.retry')}
      </Text>
    </View>
  );
}

export interface TourDetailScreenContentProps {
  tour: TourDetail;
  onStartTour: () => void;
  starting?: boolean;
}

function AnimatedSection({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function TourDetailScreenContent({
  tour,
  onStartTour,
  starting,
}: TourDetailScreenContentProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        <TourDetailCover
          coverImage={tour.coverImage}
          title={tour.title}
          rating={tour.rating}
          reviewCount={tour.reviewCount}
        />

        {/* Title + rating below image */}
        <AnimatedSection delay={60}>
          <View style={styles.titleSection}>
            <Text style={styles.tourTitle}>{tour.title}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>{STAR}</Text>
              <Text style={styles.ratingText}>{tour.rating}</Text>
              <Text style={styles.reviewCount}>
                ({tour.reviewCount} {t('tourDetail.reviews')})
              </Text>
            </View>
          </View>
        </AnimatedSection>

        <View style={styles.content}>
          <AnimatedSection delay={120}>
            <TourDetailStats
              duration={tour.duration}
              distance={tour.distance}
              difficulty={tour.difficulty}
            />
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <TourDetailAuthor authorAvatar={tour.authorAvatar} authorName={tour.author} />
          </AnimatedSection>

          <AnimatedSection delay={280}>
            <TourDetailDescription description={tour.description} tags={tour.tags} />
          </AnimatedSection>

          <AnimatedSection delay={360}>
            <TourDetailMap stops={tour.stops} />
          </AnimatedSection>

          <AnimatedSection delay={440}>
            <TourDetailStops stops={tour.stops} />
          </AnimatedSection>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <TourDetailBottomBar onStartTour={onStartTour} starting={starting} />
    </>
  );
}

export default function TourDetailScreen({ tourId }: TourDetailScreenProps) {
  const { tour, loading, error, fetchTour } = useTourDetailScreen(tourId);
  const { t } = useTranslation();

  const handleStartTour = async () => {
    console.log('Starting tour:', tourId);
    // Note: This component is kept for backwards compatibility
    // The main handleStartTour logic is in app/tour/[id].tsx
  };

  if (loading) {
    return <TourDetailScreenLoading />;
  }

  if (error || !tour) {
    return <TourDetailScreenError error={error || t('tourDetail.notFound')} onRetry={fetchTour} />;
  }

  return <TourDetailScreenContent tour={tour} onStartTour={handleStartTour} />;
}
