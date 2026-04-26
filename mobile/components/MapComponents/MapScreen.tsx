import { View, Pressable, Text, Animated } from 'react-native';
import { useMemo, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import getStyles from './MapScreen.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import BottomSlider from './BottomSlider';
import TourMap from './TourMap';
import TourCompleteModal from './TourCompleteModal';
import EndTourConfirmModal from './EndTourConfirmModal';
import NearbyToursSlider from './NearbyToursSlider';
import { getVisibleMarkers, getVisibleRoute } from '../TourStepComponents/TourNavigation.config';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import Colors from '@/constants/Colors';
import { isLoggedIn } from '@/api/auth';
import { getToursInBounds } from '@/api/tours';
import type { Tour } from '@/api/tours';
import type { MapMarkerProps } from './MapMarker.config';
import type { Region } from './TourMap.config';

import { getTourProgress, deleteTourProgress } from '@/api/tourProgress';

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
    solvedSteps,
    earnedXP,
    endTour,
    resumeActiveTour,
  } = useActiveTour();

  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [finalXP, setFinalXP] = useState<number>(0);

  // Area search state
  const [nearbyTours, setNearbyTours] = useState<Tour[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
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

  const visibleMarkers = useMemo(() => {
    if (!tour || !isActive) return [];
    return getVisibleMarkers(tour, currentStepIndex, solvedSteps);
  }, [tour, isActive, currentStepIndex, solvedSteps]);

  const visibleRoute = useMemo(() => {
    if (!tour || !isActive) return [];
    return getVisibleRoute(tour, currentStepIndex, solvedSteps);
  }, [tour, isActive, currentStepIndex, solvedSteps]);

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

  // Active tour handlers
  const handleTourComplete = useCallback(async () => {
    if (progressId) {
      try {
        const progress = await getTourProgress(progressId);
        setFinalXP(progress.total_xp);
      } catch {
        setFinalXP(earnedXP);
      }
    } else {
      setFinalXP(earnedXP);
    }
    setShowCompleteModal(true);
  }, [progressId, earnedXP]);

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

  const defaultRegion = useMemo(
    () => ({ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 }),
    []
  );

  const nearbyMarkersForMap = useMemo<MapMarkerProps[]>(() => {
    return nearbyTours
      .filter((t) => t.steps.length > 0)
      .map((t) => {
        const lat = parseFloat(t.steps[0].latitude);
        const lng = parseFloat(t.steps[0].longitude);
        const difficultyKey = (t.difficulty || '').toLowerCase() as 'easy' | 'medium' | 'hard';
        const circleColor = colors[difficultyKey] ?? colors.medium;
        return {
          id: `nearby-${t.id}`,
          coordinate: { latitude: lat, longitude: lng },
          title: t.title,
          iconType: (t.tour_type === 'PUZZLE'
            ? 'puzzle'
            : t.tour_type === 'HYBRID'
              ? 'story-puzzle'
              : 'story') as MapMarkerProps['iconType'],
          circleSize: 38,
          circleColor,
          opacity: 0.9,
        };
      })
      .filter(
        (m) => Number.isFinite(m.coordinate.latitude) && Number.isFinite(m.coordinate.longitude)
      );
  }, [nearbyTours, colors]);

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
        completedSteps={solvedSteps.size}
        totalSteps={tour.steps.length}
        onConfirm={handleConfirmEndTour}
        onCancel={handleCancelEndTour}
      />

      <TourCompleteModal
        visible={showCompleteModal}
        tour={tour}
        earnedXP={finalXP}
        completedSteps={solvedSteps.size}
        totalSteps={tour.steps.length}
        onClose={handleCloseCompleteModal}
      />
    </View>
  );
}
