import { View, Pressable, Text, Animated, Image } from 'react-native';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Supercluster from 'supercluster';

import getStyles from './MapScreen.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import BottomSlider from './BottomSlider';
import TourMap from './TourMap';
import TourCompleteModal from './TourCompleteModal';
import EndTourConfirmModal from './EndTourConfirmModal';
import NearbyToursSlider from './NearbyToursSlider';
import TourPreviewPanel from './TourPreviewPanel';
import { getVisibleMarkers, getVisibleRoute } from '../TourStepComponents/TourNavigation.config';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import Colors from '@/constants/Colors';
import { isLoggedIn } from '@/api/auth';
import { getToursInBounds } from '@/api/tours';
import type { Tour } from '@/api/tours';
import type { MapMarkerProps } from './MapMarker.config';
import type { ClusterMarkerProps } from './ClusterMarker';
import type { Region } from './TourMap.config';
import type { UserBadge } from '@/api/profile';

import { deleteTourProgress } from '@/api/tourProgress';

function regionToZoom(longitudeDelta: number): number {
  return Math.round(Math.log(360 / longitudeDelta) / Math.LN2);
}

export default function MapScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();

  const {
    tour,
    isActive,
    progressId,
    currentStepIndex,
    highestStepIndex,
    solvedSteps,
    locationConfirmedSteps,
    earnedXP,
    endTour,
    resumeActiveTour,
  } = useActiveTour();

  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [finalXP, setFinalXP] = useState<number>(0);
  const [completionBadges, setCompletionBadges] = useState<UserBadge[]>([]);

  // Area search state
  const [nearbyTours, setNearbyTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [prefetchedImages, setPrefetchedImages] = useState<Set<string>>(new Set());
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [animateToRegion, setAnimateToRegion] = useState<Region | undefined>();
  const [clusterRegion, setClusterRegion] = useState<Region | null>(null);

  const superclusterRef = useRef(
    new Supercluster<{ tourId: number }>({ radius: 60, maxZoom: 16 })
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const currentRegionRef = useRef<Region | null>(null);
  const isDraggingMapRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const initialSearchDoneRef = useRef(false);

  // ~55 km visible height — beyond this the results would be overwhelming
  const MAX_SEARCH_DELTA = 0.5;

  useFocusEffect(
    useCallback(() => {
      const checkLoginAndResume = async () => {
        if (await isLoggedIn()) {
          resumeActiveTour();
        }
      };
      checkLoginAndResume();
    }, [resumeActiveTour])
  );

  useFocusEffect(
    useCallback(() => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      spinLoop.current?.stop();
      spinAnim.setValue(0);
      setIsCoolingDown(false);
      setIsDraggingMap(false);
      isDraggingMapRef.current = false;
      initialSearchDoneRef.current = false;
      setShowSearchButton(false);

      const region = currentRegionRef.current;
      if (!region || region.latitudeDelta > MAX_SEARCH_DELTA) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setNearbyLoading(true);

      getToursInBounds(
        region.latitude + region.latitudeDelta / 2,
        region.latitude - region.latitudeDelta / 2,
        region.longitude + region.longitudeDelta / 2,
        region.longitude - region.longitudeDelta / 2,
        controller.signal
      )
        .then((tours) => {
          if (!controller.signal.aborted) {
            setNearbyTours(tours);
            setHasSearched(true);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) {
            setNearbyLoading(false);
            initialSearchDoneRef.current = true;
          }
        });

      return () => controller.abort();
    }, [MAX_SEARCH_DELTA, spinAnim])
  );

  const MAX_BANNER_MARKERS = 8;

  useEffect(() => {
    const urls = nearbyTours
      .slice(0, MAX_BANNER_MARKERS)
      .map((t) => t.cover_image)
      .filter(Boolean) as string[];
    if (urls.length === 0) return;
    Promise.all(urls.map((url) => Image.prefetch(url))).then(() => {
      setPrefetchedImages(new Set(urls));
    });
  }, [nearbyTours]);

  useEffect(() => {
    superclusterRef.current.load(
      nearbyTours
        .filter((t) => t.steps.length > 0)
        .map((t) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [parseFloat(t.steps[0].longitude), parseFloat(t.steps[0].latitude)],
          },
          properties: { tourId: t.id },
        }))
    );
    // Trigger cluster recompute with the current region
    if (currentRegionRef.current) setClusterRegion({ ...currentRegionRef.current });
  }, [nearbyTours]);

  const visibleMarkers = useMemo(() => {
    if (!tour || !isActive) return [];
    return getVisibleMarkers(tour, currentStepIndex, solvedSteps, locationConfirmedSteps);
  }, [tour, isActive, currentStepIndex, solvedSteps, locationConfirmedSteps]);

  const visibleRoute = useMemo(() => {
    if (!tour || !isActive) return [];
    return getVisibleRoute(tour, currentStepIndex, solvedSteps, locationConfirmedSteps);
  }, [tour, isActive, currentStepIndex, solvedSteps, locationConfirmedSteps]);

  const initialRegion = useMemo(() => {
    if (!tour || !isActive || tour.steps.length === 0) {
      return { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    return {
      latitude: tour.steps[0].coordinate.latitude,
      longitude: tour.steps[0].coordinate.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [tour, isActive]);

  const completedStepsForModal = useMemo(() => {
    if (!tour || tour.steps.length === 0) return 0;

    if (showCompleteModal) {
      return tour.steps.length;
    }

    // Highest reached index represents the current active step on backend;
    // completed steps are those before it.
    return Math.max(0, Math.min(highestStepIndex, tour.steps.length));
  }, [tour, highestStepIndex, showCompleteModal]);

  // Active tour handlers
  const handleTourComplete = useCallback(async (awardedXP: number, awardedBadges?: UserBadge[]) => {
    // Backend is source of truth: replay completions return awarded_xp=0.
    setFinalXP(Math.max(0, awardedXP ?? 0));
    setCompletionBadges(awardedBadges ?? []);
    setShowCompleteModal(true);
  }, []);

  const handleEndTourPress = useCallback(() => setShowEndConfirmModal(true), []);

  const handleConfirmEndTour = useCallback(async () => {
    setShowEndConfirmModal(false);
    if (!progressId) return;
    try {
      await deleteTourProgress({ id: Number(progressId) });
      endTour();
    } catch (error) {
      console.error('Failed to abort tour on the backend:', error);
    }
  }, [endTour, progressId]);

  const handleCancelEndTour = useCallback(() => setShowEndConfirmModal(false), []);

  const handleCloseCompleteModal = useCallback(() => {
    setShowCompleteModal(false);
    endTour();
  }, [endTour]);

  const handleSearchHere = useCallback(async () => {
    const region = currentRegionRef.current;
    if (!region) return;
    if (region.latitudeDelta > MAX_SEARCH_DELTA) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    spinAnim.setValue(0);
    spinLoop.current = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    );
    spinLoop.current.start();
    setIsCoolingDown(true);
    setNearbyLoading(true);
    setHasSearched(true);

    cooldownRef.current = setTimeout(() => {
      spinLoop.current?.stop();
      spinAnim.setValue(0);
      setIsCoolingDown(false);
      setShowSearchButton(false);
    }, 2500);

    try {
      const tours = await getToursInBounds(
        region.latitude + region.latitudeDelta / 2,
        region.latitude - region.latitudeDelta / 2,
        region.longitude + region.longitudeDelta / 2,
        region.longitude - region.longitudeDelta / 2,
        controller.signal
      );
      if (!controller.signal.aborted) setNearbyTours(tours);
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') setNearbyTours([]);
    } finally {
      setNearbyLoading(false);
    }
  }, [MAX_SEARCH_DELTA, spinAnim]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      currentRegionRef.current = region;
      isDraggingMapRef.current = false;
      setIsDraggingMap(false);
      setIsZoomedOut(region.latitudeDelta > MAX_SEARCH_DELTA);
      setClusterRegion(region);
      if (initialSearchDoneRef.current) setShowSearchButton(true);
    },
    [MAX_SEARCH_DELTA]
  );

  const handleRegionChange = useCallback((region: Region) => {
    currentRegionRef.current = region;

    if (!initialSearchDoneRef.current || isDraggingMapRef.current) return;

    isDraggingMapRef.current = true;
    setIsDraggingMap(true);
    setShowSearchButton(true);
  }, []);

  const handleUserLocationReady = useCallback(
    async (region: Region) => {
      currentRegionRef.current = region;
      setIsZoomedOut(region.latitudeDelta > MAX_SEARCH_DELTA);

      if (initialSearchDoneRef.current || region.latitudeDelta > MAX_SEARCH_DELTA) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setNearbyLoading(true);

      try {
        const tours = await getToursInBounds(
          region.latitude + region.latitudeDelta / 2,
          region.latitude - region.latitudeDelta / 2,
          region.longitude + region.longitudeDelta / 2,
          region.longitude - region.longitudeDelta / 2,
          controller.signal
        );
        if (!controller.signal.aborted) {
          setNearbyTours(tours);
          setHasSearched(true);
        }
      } catch {
        if (!controller.signal.aborted) setNearbyTours([]);
      } finally {
        if (!controller.signal.aborted) {
          setNearbyLoading(false);
          initialSearchDoneRef.current = true;
        }
      }
    },
    [MAX_SEARCH_DELTA]
  );

  const handleNearbyTourPress = useCallback(
    (tourId: number) => {
      router.push(`/tour/${tourId}`);
    },
    [router]
  );

  const handlePreviewViewTour = useCallback(
    (tourId: number) => {
      setSelectedTour(null);
      router.push(`/tour/${tourId}`);
    },
    [router]
  );

  const defaultRegion = useMemo(
    () => ({ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 }),
    []
  );

  const { nearbyMarkersForMap, clusterMarkersForMap } = useMemo<{
    nearbyMarkersForMap: MapMarkerProps[];
    clusterMarkersForMap: ClusterMarkerProps[];
  }>(() => {
    const region = clusterRegion ?? currentRegionRef.current;
    if (!region || nearbyTours.length === 0) {
      return { nearbyMarkersForMap: [], clusterMarkersForMap: [] };
    }

    const zoom = regionToZoom(region.longitudeDelta);
    const bbox: [number, number, number, number] = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ];

    const items = superclusterRef.current.getClusters(bbox, zoom);
    const tourById = new Map(nearbyTours.map((t) => [t.id, t]));

    const individualMarkers: MapMarkerProps[] = [];
    const clusterMarkers: ClusterMarkerProps[] = [];

    for (const item of items) {
      const [lng, lat] = item.geometry.coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const props = item.properties as any;
      if (props.cluster) {
        const clusterId = props.cluster_id as number;
        clusterMarkers.push({
          id: `cluster-${clusterId}`,
          coordinate: { latitude: lat, longitude: lng },
          count: props.point_count as number,
          onPress: () => {
            const expansionZoom = superclusterRef.current.getClusterExpansionZoom(clusterId);
            const delta = 360 / Math.pow(2, Math.min(expansionZoom, 18));
            setAnimateToRegion({
              latitude: lat,
              longitude: lng,
              latitudeDelta: delta,
              longitudeDelta: delta,
            });
          },
        });
      } else {
        const tour = tourById.get(props.tourId as number);
        if (!tour) continue;
        const difficultyKey = (tour.difficulty || '').toLowerCase() as 'easy' | 'medium' | 'hard';
        const circleColor = colors[difficultyKey] ?? colors.medium;
        individualMarkers.push({
          id: `nearby-${tour.id}`,
          coordinate: { latitude: lat, longitude: lng },
          title: tour.title,
          iconType: (tour.tour_type === 'PUZZLE'
            ? 'puzzle'
            : tour.tour_type === 'HYBRID'
              ? 'story-puzzle'
              : 'story') as MapMarkerProps['iconType'],
          circleSize: 38,
          circleColor,
          opacity: 0.9,
          coverImage:
            tour.cover_image && prefetchedImages.has(tour.cover_image)
              ? tour.cover_image
              : undefined,
          selected: selectedTour?.id === tour.id,
          onPress: () => setSelectedTour(tour),
        });
      }
    }

    return { nearbyMarkersForMap: individualMarkers, clusterMarkersForMap: clusterMarkers };
  }, [nearbyTours, prefetchedImages, colors, clusterRegion, selectedTour]);

  // No active tour — area search map
  if (!isActive || !tour) {
    return (
      <View style={styles.container}>
        <TourMap
          markers={[]}
          route={[]}
          initialRegion={defaultRegion}
          currentStepIndex={0}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onUserLocationReady={handleUserLocationReady}
          nearbyMarkers={nearbyMarkersForMap}
          clusterMarkers={clusterMarkersForMap}
          animateToRegion={animateToRegion}
        />

        {/* Search Here — visible only after initial load when user moves the map */}
        {showSearchButton && (
          <Pressable
            style={[
              styles.searchHereButton,
              (isDraggingMap || isZoomedOut || nearbyLoading || isCoolingDown) &&
                styles.searchHereButtonDisabled,
            ]}
            onPress={
              isDraggingMap || isZoomedOut || nearbyLoading || isCoolingDown
                ? undefined
                : handleSearchHere
            }
          >
            {isZoomedOut ? (
              <MaterialCommunityIcons
                name="magnify-minus-outline"
                size={16}
                color={colors.subText}
              />
            ) : (
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={16}
                  color={
                    isDraggingMap || nearbyLoading || isCoolingDown
                      ? colors.subText
                      : colors.primary
                  }
                />
              </Animated.View>
            )}
            <Text
              style={[
                styles.searchHereText,
                (isDraggingMap || isZoomedOut || nearbyLoading || isCoolingDown) &&
                  styles.searchHereTextDisabled,
              ]}
            >
              {nearbyLoading
                ? t('map.nearby.searching')
                : isDraggingMap
                  ? t('map.searchMode.stopDragging')
                  : isZoomedOut
                    ? t('map.searchMode.zoomIn')
                    : t('map.searchMode.searchHere')}
            </Text>
          </Pressable>
        )}

        <TourPreviewPanel
          tour={selectedTour}
          onClose={() => setSelectedTour(null)}
          onViewTour={handlePreviewViewTour}
        />

        {hasSearched && (
          <NearbyToursSlider
            tours={nearbyTours}
            loading={nearbyLoading}
            onTourPress={handleNearbyTourPress}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TourMap
        markers={visibleMarkers}
        route={visibleRoute}
        initialRegion={initialRegion}
        currentStepIndex={currentStepIndex}
        tour={tour}
      />

      <BottomSlider
        tour={tour}
        onEndTour={handleEndTourPress}
        onTourComplete={handleTourComplete}
      />

      <EndTourConfirmModal
        visible={showEndConfirmModal}
        earnedXP={earnedXP}
        completedSteps={completedStepsForModal}
        totalSteps={tour.steps.length}
        onConfirm={handleConfirmEndTour}
        onCancel={handleCancelEndTour}
      />

      <TourCompleteModal
        visible={showCompleteModal}
        tour={tour}
        earnedXP={finalXP}
        awardedBadges={completionBadges}
        completedSteps={completedStepsForModal}
        totalSteps={tour.steps.length}
        onClose={handleCloseCompleteModal}
      />
    </View>
  );
}
