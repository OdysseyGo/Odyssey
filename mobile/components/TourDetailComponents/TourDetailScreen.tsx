import {
  View,
  ScrollView,
  Text,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import BackButton from '@/components/common/BackButton';
import { Spacing } from '@/constants/Spacing';
import { getTour } from '@/api/tours';
import { getCurrentUser } from '@/api/auth';
import { TourDetail } from './TourDetail.config';
import { TourDetailScreenProps, mapApiTourToDetail } from './TourDetailScreen.config';
import { tourDetailScreenStyles } from './TourDetailScreen.styles';
import TourDetailCover from './TourDetailCover';
import TourDetailStats from './TourDetailStats';
import TourDetailAuthor from './TourDetailAuthor';
import TourDetailDescription from './TourDetailDescription';
import TourDetailMap from './TourDetailMap';
import TourDetailStops from './TourDetailStops';
import TourDetailReviews from './TourDetailReviews';
import TourDetailBottomBar from './TourDetailBottomBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// Shimmer skeleton block
// ─────────────────────────────────────────────────────────

function ShimmerBlock({
  width,
  height,
  borderRadius = 12,
  style,
  color,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
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

interface TourDetailScreenState {
  tour: TourDetail | null;
  showAllStops: boolean;
  loading: boolean;
  error: string | null;
}

interface TourDetailScreenResult extends TourDetailScreenState {
  fetchTour: () => Promise<void>;
}

export function useTourDetailScreen(tourId: string): TourDetailScreenResult {
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [showAllStops, setShowAllStops] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchTour = useCallback(async () => {
    if (!tourId) return;

    try {
      setLoading(true);
      setError(null);
      setShowAllStops(false);
      const [tourData, currentUser] = await Promise.all([
        getTour(parseInt(tourId, 10)),
        getCurrentUser(),
      ]);
      setTour(mapApiTourToDetail(tourData, t));
      setShowAllStops(Boolean(currentUser && tourData.creator?.id === currentUser.id));
    } catch (err: any) {
      setError(err.message || 'Failed to load tour');
    } finally {
      setLoading(false);
    }
  }, [tourId, t]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  return { tour, showAllStops, loading, error, fetchTour };
}

export interface TourDetailScreenLoadingProps {
  message?: string;
}

export function TourDetailScreenLoading({ message: _message }: TourDetailScreenLoadingProps) {
  const theme = useColorTheme();
  const colors = Colors[theme];
  const shimmer = colors.foregroundSecondary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Cover skeleton */}
      <ShimmerBlock width={SCREEN_WIDTH} height={460} borderRadius={0} color={shimmer} />

      {/* Content skeleton */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md }}>
        {/* Stats row */}
        <ShimmerBlock width="100%" height={88} color={shimmer} />

        {/* Author row */}
        <View
          style={{
            flexDirection: 'row',
            gap: Spacing.md,
            alignItems: 'center',
            marginTop: Spacing.xs,
          }}
        >
          <ShimmerBlock width={52} height={52} borderRadius={26} color={shimmer} />
          <View style={{ gap: Spacing.sm }}>
            <ShimmerBlock width={72} height={12} borderRadius={6} color={shimmer} />
            <ShimmerBlock width={140} height={16} borderRadius={6} color={shimmer} />
          </View>
        </View>

        {/* Description lines */}
        <View style={{ gap: Spacing.sm, marginTop: Spacing.xs }}>
          <ShimmerBlock width={110} height={18} borderRadius={6} color={shimmer} />
          <ShimmerBlock width="100%" height={13} borderRadius={6} color={shimmer} />
          <ShimmerBlock width="92%" height={13} borderRadius={6} color={shimmer} />
          <ShimmerBlock width="76%" height={13} borderRadius={6} color={shimmer} />
        </View>

        {/* Map block */}
        <ShimmerBlock width="100%" height={180} color={shimmer} style={{ marginTop: Spacing.xs }} />
      </View>
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
    <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.errorCard,
          { backgroundColor: colors.foreground },
          Platform.select({
            ios: {
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
            },
            android: { elevation: 8 },
          }),
        ]}
      >
        <View style={[styles.errorIconWrap, { backgroundColor: `${colors.error}15` }]}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.error} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          {t('tourDetail.errorTitle', { defaultValue: 'Something went wrong' })}
        </Text>
        <Text style={[styles.errorText, { color: colors.subText }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color={colors.white} />
          <Text style={[styles.retryButtonText, { color: colors.white }]}>
            {t('tourDetail.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export interface TourDetailScreenContentProps {
  tour: TourDetail;
  onStartTour: () => void;
  starting?: boolean;
  showAllStops?: boolean;
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

const COVER_HEIGHT = 460;
const FADE_START = 300;
const FADE_END = 420;

export function TourDetailScreenContent({
  tour,
  onStartTour,
  starting,
  showAllStops = false,
}: TourDetailScreenContentProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailScreenStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [FADE_START, FADE_END],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [FADE_START + 40, FADE_END + 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // White button fades out as header solidifies; theme-colored fades in
  const whiteButtonOpacity = scrollY.interpolate({
    inputRange: [FADE_START, FADE_END],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const themedButtonOpacity = scrollY.interpolate({
    inputRange: [FADE_START, FADE_END],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <>
      <Animated.ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <TourDetailCover
          coverImage={tour.coverImage}
          coverImageAttribution={tour.coverImageAttribution}
          title={tour.title}
          rating={tour.rating}
          reviewCount={tour.reviewCount}
        />

        <View style={styles.content}>
          <AnimatedSection delay={80}>
            <TourDetailStats
              duration={tour.duration}
              distance={tour.distance}
              difficulty={tour.difficulty}
              elevationGain={tour.elevationGain}
              requiresTransport={tour.requiresTransport}
              isCircular={tour.isCircular}
              accessibilityRating={tour.accessibilityRating}
              metricsCalculated={tour.metricsCalculated}
            />
          </AnimatedSection>

          <AnimatedSection delay={160}>
            <TourDetailAuthor
              authorId={tour.authorId}
              authorAvatar={tour.authorAvatar}
              authorName={tour.author}
            />
          </AnimatedSection>

          <AnimatedSection delay={240}>
            <TourDetailDescription description={tour.description} tags={tour.tags} />
          </AnimatedSection>

          <AnimatedSection delay={320}>
            <TourDetailMap stops={tour.stops} showAllStops={showAllStops} />
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <TourDetailStops stops={tour.stops} showAllStops={showAllStops} />
          </AnimatedSection>

          <AnimatedSection delay={480}>
            <TourDetailReviews tourId={parseInt(tour.id)} />
          </AnimatedSection>

          <View style={styles.bottomSpacer} />
        </View>
      </Animated.ScrollView>

      {/* Scroll-aware overlay header */}
      <View style={[styles.overlayHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View style={[styles.overlayHeaderBg, { opacity: headerBgOpacity }]} />
        <View style={styles.overlayHeaderContent} pointerEvents="box-none">
          <View style={styles.overlaySpacer}>
            <Animated.View style={[styles.overlayAbsoluteFill, { opacity: whiteButtonOpacity }]}>
              <BackButton color={Colors[theme].white} />
            </Animated.View>
            <Animated.View style={[styles.overlayAbsoluteFill, { opacity: themedButtonOpacity }]}>
              <BackButton color={Colors[theme].text} />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.overlayTitle, { opacity: titleOpacity }]} numberOfLines={1}>
            {tour.title}
          </Animated.Text>
          <View style={styles.overlaySpacer} />
        </View>
      </View>

      <TourDetailBottomBar onStartTour={onStartTour} starting={starting} />
    </>
  );
}

export default function TourDetailScreen({ tourId }: TourDetailScreenProps) {
  const { tour, showAllStops, loading, error, fetchTour } = useTourDetailScreen(tourId);
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

  return (
    <TourDetailScreenContent
      tour={tour}
      onStartTour={handleStartTour}
      showAllStops={showAllStops}
    />
  );
}
