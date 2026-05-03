import { View, Pressable, Text, Animated } from 'react-native';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import getStyles from './MapScreen.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import BottomSlider from './BottomSlider';
import TourMap from './TourMap';
import TourCompleteModal from './TourCompleteModal';
import EndTourConfirmModal from './EndTourConfirmModal';
import NearbyToursSlider from './NearbyToursSlider';
import TourPreviewPanel from './TourPreviewPanel';
import type { MapTour } from './MapTour.types';
import { getVisibleMarkers, getVisibleRoute } from '../TourStepComponents/TourNavigation.config';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import Colors from '@/constants/Colors';
import { isLoggedIn } from '@/api/auth';
import { getTour, getToursInBounds } from '@/api/tours';
import type { Difficulty, InBoundsFilters, InBoundsSort, Tour, TourType } from '@/api/tours';
import { deleteTourProgress } from '@/api/tourProgress';
import type { MapMarkerProps } from './MapMarker.config';
import type { Region, TourMapMode } from './TourMap.config';
import type { UserBadge } from '@/api/profile';
import { useInterstitial } from '@/components/Ads/useInterstitial';
import { TOUR_CATEGORIES } from '@/components/TourCreation';

const MAX_SEARCH_DELTA = 0.5;
const MAX_NEARBY_TOURS_TO_RENDER = 10;

type CompletionSummary = {
  tourId: string;
  tourTitle: string;
  finalXP: number;
  badges: UserBadge[];
  completedAt: string;
  completedSteps: number;
  totalSteps: number;
};

function isValidRegion(region: Region | null | undefined): region is Region {
  if (!region) return false;
  return (
    Number.isFinite(region.latitude) &&
    Number.isFinite(region.longitude) &&
    Number.isFinite(region.latitudeDelta) &&
    Number.isFinite(region.longitudeDelta) &&
    region.latitude >= -90 &&
    region.latitude <= 90 &&
    region.longitude >= -180 &&
    region.longitude <= 180 &&
    region.latitudeDelta > 0 &&
    region.longitudeDelta > 0
  );
}

const EMPTY_MARKERS: MapMarkerProps[] = [];

function sortNearbyTours(tours: MapTour[], sort: InBoundsSort): MapTour[] {
  return [...tours].sort((a, b) => {
    if (sort === 'name') {
      return a.title.localeCompare(b.title);
    }
    if (sort === 'reviews') {
      const reviewDelta = (b.review_count ?? 0) - (a.review_count ?? 0);
      if (reviewDelta !== 0) return reviewDelta;
      return (b.average_rating ?? 0) - (a.average_rating ?? 0);
    }
    if (sort === 'newest') {
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    }
    const ratingDelta = (b.average_rating ?? 0) - (a.average_rating ?? 0);
    if (ratingDelta !== 0) return ratingDelta;
    return (b.review_count ?? 0) - (a.review_count ?? 0);
  });
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toMapTour(raw: unknown): MapTour | null {
  const data = raw as Record<string, unknown> | null;
  if (!data) return null;

  const id = typeof data.id === 'number' ? data.id : Number.parseInt(String(data.id), 10);
  const title = typeof data.title === 'string' ? data.title : '';
  if (!Number.isFinite(id) || !title) return null;

  const difficulty =
    data.difficulty === 'EASY' || data.difficulty === 'MEDIUM' || data.difficulty === 'HARD'
      ? data.difficulty
      : 'MEDIUM';
  const tourType =
    data.tour_type === 'STORY' || data.tour_type === 'PUZZLE' || data.tour_type === 'HYBRID'
      ? data.tour_type
      : 'STORY';

  const firstStep = Array.isArray(data.steps)
    ? (data.steps[0] as Record<string, unknown> | undefined)
    : undefined;

  const firstLat = toFiniteNumber(data.first_lat ?? firstStep?.latitude);
  const firstLng = toFiniteNumber(data.first_lng ?? firstStep?.longitude);

  return {
    id,
    title,
    category: typeof data.category === 'string' ? data.category : undefined,
    difficulty,
    tour_type: tourType,
    duration_minutes:
      typeof data.duration_minutes === 'number' && Number.isFinite(data.duration_minutes)
        ? data.duration_minutes
        : 0,
    cover_image: typeof data.cover_image === 'string' ? data.cover_image : undefined,
    average_rating: toFiniteNumber(data.average_rating),
    review_count:
      typeof data.review_count === 'number' && Number.isFinite(data.review_count)
        ? data.review_count
        : undefined,
    created_at: typeof data.created_at === 'string' ? data.created_at : undefined,
    first_lat: firstLat,
    first_lng: firstLng,
  };
}

function normalizeMapTours(rawTours: unknown[]): MapTour[] {
  const tours: MapTour[] = [];
  for (const rawTour of rawTours) {
    const parsed = toMapTour(rawTour);
    if (parsed) tours.push(parsed);
  }
  return tours;
}

function approximateJsonSizeBytes(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

export default function MapScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(null);
  const [mapResetVersion, setMapResetVersion] = useState(0);
  const { show: showTourCompleteInterstitial } = useInterstitial('tour_complete_interstitial');
  const completingTourRef = useRef(false);
  const completionResetTourIdRef = useRef<string | null>(null);
  const lastActiveTourIdRef = useRef<string | null>(null);

  const [nearbyTours, setNearbyTours] = useState<MapTour[]>([]);
  const [nearbySort, setNearbySort] = useState<InBoundsSort>('rating');
  const [nearbyFilters, setNearbyFilters] = useState<InBoundsFilters>({});
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedNearbyTourId, setSelectedNearbyTourId] = useState<number | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [animateToRegion, setAnimateToRegion] = useState<Region | undefined>();
  const [centerOnUserRequestKey, setCenterOnUserRequestKey] = useState<number | undefined>(
    undefined
  );

  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const currentRegionRef = useRef<Region | null>(null);
  const nearbySortRef = useRef<InBoundsSort>('rating');
  const nearbyFiltersRef = useRef<InBoundsFilters>({});
  const regionBeforeSelectionRef = useRef<Region | null>(null);
  const isDraggingMapRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedTourControllerRef = useRef<AbortController | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedBboxRef = useRef<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const lastMarkerPressAtRef = useRef<number>(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const legendAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const initialSearchDoneRef = useRef(false);
  const lastSortTapAtRef = useRef(0);
  const selectedNearbyTourIdRef = useRef<number | null>(null);
  const wasActiveBranchRef = useRef<boolean | null>(null);
  const [legendPanelHeight, setLegendPanelHeight] = useState(168);
  const filterPanelAnim = useRef(new Animated.Value(0)).current;
  const mapMode: TourMapMode = isActive && tour ? 'active-tour' : 'explore';
  const mapInstanceKey = `${mapMode}:${mapResetVersion}`;

  useEffect(() => {
    nearbyFiltersRef.current = nearbyFilters;
  }, [nearbyFilters]);

  useEffect(() => {
    const activeTourId = isActive && tour ? tour.id : null;
    if (activeTourId && activeTourId !== lastActiveTourIdRef.current) {
      completionResetTourIdRef.current = null;
    }
    lastActiveTourIdRef.current = activeTourId;
  }, [isActive, tour]);

  useEffect(() => {
    selectedNearbyTourIdRef.current = selectedNearbyTourId;
  }, [selectedNearbyTourId]);

  useEffect(() => {
    const isActiveBranch = Boolean(isActive && tour);
    if (__DEV__ && wasActiveBranchRef.current !== isActiveBranch) {
      console.log('[MapScreen] branch_transition', {
        branch: isActiveBranch ? 'active' : 'inactive',
        tourId: tour?.id ?? null,
      });
    }
    wasActiveBranchRef.current = isActiveBranch;
  }, [isActive, tour]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      selectedTourControllerRef.current?.abort();
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
      spinLoop.current?.stop();
      spinAnim.stopAnimation();
      legendAnim.stopAnimation();
      filterPanelAnim.stopAnimation();
    };
  }, [filterPanelAnim, legendAnim, spinAnim]);

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

  const fetchNearbyMapTours = useCallback(
    async (
      north: number,
      south: number,
      east: number,
      west: number,
      signal: AbortSignal
    ): Promise<MapTour[]> => {
      const rawTours = await getToursInBounds(
        north,
        south,
        east,
        west,
        {
          sort: nearbySortRef.current,
          fields: 'map',
          filters: nearbyFiltersRef.current,
        },
        signal
      );

      const normalizedTours = normalizeMapTours(rawTours as unknown[]);
      if (__DEV__) {
        console.log('[MapScreen] in_bounds_payload', {
          count: normalizedTours.length,
          approxBytes: approximateJsonSizeBytes(rawTours),
        });
      }
      return normalizedTours;
    },
    []
  );

  const clearSelectedTour = useCallback(() => {
    selectedTourControllerRef.current?.abort();
    selectedTourControllerRef.current = null;
    setSelectedNearbyTourId(null);
    setSelectedTour(null);
  }, []);

  const fetchSelectedTourDetails = useCallback(async (tourId: number) => {
    selectedTourControllerRef.current?.abort();
    const controller = new AbortController();
    selectedTourControllerRef.current = controller;

    try {
      const fullTour = await getTour(tourId, controller.signal);
      if (controller.signal.aborted) return;
      if (selectedNearbyTourIdRef.current !== tourId) return;
      setSelectedTour(fullTour);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(`Failed to fetch selected tour details (${tourId})`, error);
      if (selectedNearbyTourIdRef.current === tourId) {
        setSelectedNearbyTourId(null);
        setSelectedTour(null);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      spinLoop.current?.stop();
      spinAnim.setValue(0);
      setIsCoolingDown(false);
      setIsDraggingMap(false);
      isDraggingMapRef.current = false;
      setShowSearchButton(false);

      const region = currentRegionRef.current;
      if (!isValidRegion(region) || region.latitudeDelta > MAX_SEARCH_DELTA) return;

      const cached = lastFetchedBboxRef.current;
      if (cached) {
        const north = region.latitude + region.latitudeDelta / 2;
        const south = region.latitude - region.latitudeDelta / 2;
        const east = region.longitude + region.longitudeDelta / 2;
        const west = region.longitude - region.longitudeDelta / 2;
        if (
          north <= cached.north &&
          south >= cached.south &&
          east <= cached.east &&
          west >= cached.west
        ) {
          initialSearchDoneRef.current = true;
          return;
        }
      }

      initialSearchDoneRef.current = false;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setNearbyLoading(true);

      const north = region.latitude + region.latitudeDelta / 2;
      const south = region.latitude - region.latitudeDelta / 2;
      const east = region.longitude + region.longitudeDelta / 2;
      const west = region.longitude - region.longitudeDelta / 2;

      fetchNearbyMapTours(north, south, east, west, controller.signal)
        .then((tours) => {
          if (!controller.signal.aborted) {
            setNearbyTours(sortNearbyTours(tours, nearbySortRef.current));
            lastFetchedBboxRef.current = { north, south, east, west };
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) {
            setNearbyLoading(false);
            initialSearchDoneRef.current = true;
          }
        });

      return () => {
        controller.abort();
        clearSelectedTour();
        setNearbyTours([]);
      };
    }, [clearSelectedTour, fetchNearbyMapTours, spinAnim])
  );

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

  const completedStepsForEndTour = useMemo(() => {
    if (!tour || tour.steps.length === 0) return 0;
    return Math.max(0, Math.min(highestStepIndex, tour.steps.length));
  }, [tour, highestStepIndex]);

  const handleTourComplete = useCallback(
    async (awardedXP: number, awardedBadges?: UserBadge[]) => {
      if (completingTourRef.current) return;
      completingTourRef.current = true;

      if (!tour) {
        completingTourRef.current = false;
        return;
      }

      try {
        await showTourCompleteInterstitial();
      } catch (error) {
        console.warn('[MapScreen] tour completion interstitial failed', error);
      }

      const totalSteps = tour.steps.length;
      const summary: CompletionSummary = {
        tourId: tour.id,
        tourTitle: tour.title,
        finalXP: Math.max(0, awardedXP ?? 0),
        badges: awardedBadges ?? [],
        completedAt: new Date().toISOString(),
        completedSteps: totalSteps,
        totalSteps,
      };

      setCompletionSummary(summary);
      if (__DEV__) {
        console.log('[MapScreen] completion_summary_set', {
          tourId: summary.tourId,
          totalSteps: summary.totalSteps,
          finalXP: summary.finalXP,
          badgeCount: summary.badges.length,
          completedAt: summary.completedAt,
        });
      }

      setShowCompleteModal(true);
      if (__DEV__) {
        console.log('[MapScreen] active_tour_clear_on_completion', {
          tourId: summary.tourId,
        });
      }
      endTour();
      if (completionResetTourIdRef.current !== summary.tourId) {
        completionResetTourIdRef.current = summary.tourId;
        setMapResetVersion((previousVersion) => {
          const nextVersion = previousVersion + 1;
          if (__DEV__) {
            console.log('[MapScreen] map_reset_increment_on_completion', {
              tourId: summary.tourId,
              nextResetVersion: nextVersion,
            });
          }
          return nextVersion;
        });
      }
    },
    [endTour, showTourCompleteInterstitial, tour]
  );

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
    setCompletionSummary(null);
    completingTourRef.current = false;
  }, []);

  const handleSearchHere = useCallback(async () => {
    const region = currentRegionRef.current;
    if (!isValidRegion(region) || region.latitudeDelta > MAX_SEARCH_DELTA) return;

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

    cooldownRef.current = setTimeout(() => {
      spinLoop.current?.stop();
      spinAnim.setValue(0);
      setIsCoolingDown(false);
    }, 2500);

    const north = region.latitude + region.latitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const west = region.longitude - region.longitudeDelta / 2;

    try {
      const tours = await fetchNearbyMapTours(north, south, east, west, controller.signal);
      if (!controller.signal.aborted) {
        setNearbyTours(sortNearbyTours(tours, nearbySortRef.current));
        lastFetchedBboxRef.current = { north, south, east, west };
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setNearbyTours([]);
      }
    } finally {
      setNearbyLoading(false);
    }
  }, [fetchNearbyMapTours, spinAnim]);

  const handleRegionChangeComplete = useCallback((region: Region) => {
    currentRegionRef.current = region;
    isDraggingMapRef.current = false;
    setIsDraggingMap(false);
    setIsZoomedOut(region.latitudeDelta > MAX_SEARCH_DELTA);
    if (initialSearchDoneRef.current) setShowSearchButton(true);
  }, []);

  const handleRegionChange = useCallback((region: Region) => {
    currentRegionRef.current = region;

    if (!initialSearchDoneRef.current || isDraggingMapRef.current) return;

    isDraggingMapRef.current = true;
    setIsDraggingMap(true);
    setShowSearchButton(true);
  }, []);

  const handleUserLocationReady = useCallback(async (region: Region) => {
    currentRegionRef.current = region;
    setIsZoomedOut(region.latitudeDelta > MAX_SEARCH_DELTA);

    if (initialSearchDoneRef.current || region.latitudeDelta > MAX_SEARCH_DELTA) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setNearbyLoading(true);

    const north = region.latitude + region.latitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const west = region.longitude - region.longitudeDelta / 2;

    try {
      const tours = await fetchNearbyMapTours(north, south, east, west, controller.signal);
      if (!controller.signal.aborted) {
        setNearbyTours(sortNearbyTours(tours, nearbySortRef.current));
        lastFetchedBboxRef.current = { north, south, east, west };
      }
    } catch {
      if (!controller.signal.aborted) {
        setNearbyTours([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setNearbyLoading(false);
        initialSearchDoneRef.current = true;
      }
    }
  }, [fetchNearbyMapTours]);

  const getTourCoordinates = useCallback(
    (tour: MapTour): { latitude: number; longitude: number } | null => {
      const lat = toFiniteNumber(tour.first_lat);
      const lng = toFiniteNumber(tour.first_lng);
      if (lat === undefined || lng === undefined) return null;
      if (lat < -85 || lat > 85 || lng < -180 || lng > 180) return null;
      return { latitude: lat, longitude: lng };
    },
    []
  );

  const selectTourForPreview = useCallback(
    (tour: MapTour) => {
      const coordinates = getTourCoordinates(tour);
      if (!coordinates) return;

      if (isValidRegion(currentRegionRef.current)) {
        regionBeforeSelectionRef.current = { ...currentRegionRef.current };
      }

      lastMarkerPressAtRef.current = Date.now();
      setSelectedNearbyTourId(tour.id);
      setSelectedTour(null);
      setShowCategoryFilters(false);
      setAnimateToRegion({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      });

      void fetchSelectedTourDetails(tour.id);
    },
    [fetchSelectedTourDetails, getTourCoordinates]
  );

  const handleNearbyTourPress = useCallback(
    (tourId: number) => {
      const targetTour = nearbyTours.find((item) => item.id === tourId);
      if (!targetTour) return;
      selectTourForPreview(targetTour);
    },
    [nearbyTours, selectTourForPreview]
  );

  const handlePreviewClose = useCallback(() => {
    const previousRegion = regionBeforeSelectionRef.current;
    clearSelectedTour();
    if (isValidRegion(previousRegion)) {
      setAnimateToRegion(previousRegion);
    }
    regionBeforeSelectionRef.current = null;
  }, [clearSelectedTour]);

  const handlePreviewViewTour = useCallback(
    (tourId: number) => {
      clearSelectedTour();
      setShowCategoryFilters(false);
      router.push(`/tour/${tourId}`);
    },
    [clearSelectedTour, router]
  );

  const handleMapPress = useCallback(() => {
    if (Date.now() - lastMarkerPressAtRef.current < 250) return;
    clearSelectedTour();
  }, [clearSelectedTour]);

  const handleCenterOnUser = useCallback(() => {
    setCenterOnUserRequestKey((prev) => (prev ?? 0) + 1);
  }, []);

  const handleFocusCurrentStep = useCallback(() => {
    if (!tour || !isActive) return;
    const currentStep = tour.steps[currentStepIndex];
    if (!currentStep) return;

    setAnimateToRegion({
      latitude: currentStep.coordinate.latitude,
      longitude: currentStep.coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, [tour, isActive, currentStepIndex]);

  const handleSortChange = useCallback((sort: InBoundsSort) => {
    if (sort === nearbySortRef.current) return;
    const now = Date.now();
    if (now - lastSortTapAtRef.current < 180) return;
    lastSortTapAtRef.current = now;

    setNearbySort(sort);
    nearbySortRef.current = sort;
    setNearbyTours((prev) => sortNearbyTours(prev, sort));
  }, []);

  const handleFiltersChange = useCallback((nextFilters: InBoundsFilters) => {
    setNearbyFilters(nextFilters);
    nearbyFiltersRef.current = nextFilters;
    setShowSearchButton(true);
    clearSelectedTour();
  }, [clearSelectedTour]);

  const defaultRegion = useMemo(
    () => ({ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 }),
    []
  );

  const nearbyToursForMap = useMemo(
    () => sortNearbyTours(nearbyTours, 'rating').slice(0, MAX_NEARBY_TOURS_TO_RENDER),
    [nearbyTours]
  );

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[MapScreen] nearby_state', {
      nearbyToursCount: nearbyTours.length,
      nearbyToursForMapCount: nearbyToursForMap.length,
      selectedTourSummary: selectedNearbyTourId ? 'summary-selected' : 'none',
      selectedTourDetails: selectedTour ? 'full-loaded' : selectedNearbyTourId ? 'loading' : 'none',
    });
  }, [nearbyTours.length, nearbyToursForMap.length, selectedNearbyTourId, selectedTour]);

  const nearbyMarkersForMap = useMemo(() => {
    if (nearbyToursForMap.length === 0) return EMPTY_MARKERS;
    const selectedId = selectedNearbyTourId ? `nearby-${selectedNearbyTourId}` : null;
    const individualMarkers: MapMarkerProps[] = [];

    for (const tour of nearbyToursForMap) {
      const coordinates = getTourCoordinates(tour);
      if (!coordinates) continue;
      const difficultyKey = (tour.difficulty || '').toLowerCase() as 'easy' | 'medium' | 'hard';
      const circleColor = colors[difficultyKey] ?? colors.medium;
      individualMarkers.push({
        id: `nearby-${tour.id}`,
        coordinate: coordinates,
        title: tour.title,
        iconType: (tour.tour_type === 'PUZZLE'
          ? 'puzzle'
          : tour.tour_type === 'HYBRID'
            ? 'story-puzzle'
            : 'story') as MapMarkerProps['iconType'],
        circleSize: 38,
        circleColor,
        opacity: 0.9,
        selected: selectedId !== null && `nearby-${tour.id}` === selectedId,
        onPress: () => {
          selectTourForPreview(tour);
        },
      });
    }

    return individualMarkers;
  }, [colors, getTourCoordinates, nearbyToursForMap, selectTourForPreview, selectedNearbyTourId]);

  const markerLegendItems = useMemo(
    () => [
      {
        key: 'story',
        icon: 'book-outline' as const,
        label: t('tour.story', { defaultValue: 'Story' }),
      },
      {
        key: 'puzzle',
        icon: 'puzzle' as const,
        label: t('tour.puzzle', { defaultValue: 'Puzzle' }),
      },
      {
        key: 'hybrid',
        icon: 'book-play' as const,
        label: t('tour.hybrid', { defaultValue: 'Hybrid' }),
      },
    ],
    [t]
  );
  const mapVisibleTourIds = useMemo(
    () => nearbyToursForMap.map((tour) => tour.id),
    [nearbyToursForMap]
  );
  const nearbyCategoryOptions = useMemo(() => {
    const knownCategories = new Set(TOUR_CATEGORIES.map((value) => value.trim()).filter(Boolean));
    nearbyTours.forEach((tour) => {
      const category = tour.category?.trim();
      if (category) knownCategories.add(category);
    });
    return Array.from(knownCategories).sort((a, b) => a.localeCompare(b));
  }, [nearbyTours]);
  const nearbyDifficultyOptions = useMemo(
    () =>
      [
        { value: 'EASY' as Difficulty, label: t('tourDetail.easy', { defaultValue: 'Easy' }) },
        {
          value: 'MEDIUM' as Difficulty,
          label: t('tourDetail.medium', { defaultValue: 'Medium' }),
        },
        { value: 'HARD' as Difficulty, label: t('tourDetail.hard', { defaultValue: 'Hard' }) },
      ] as const,
    [t]
  );
  const nearbyTourTypeOptions = useMemo(
    () =>
      [
        { value: 'STORY' as TourType, label: t('tour.story', { defaultValue: 'Story' }) },
        { value: 'PUZZLE' as TourType, label: t('tour.puzzle', { defaultValue: 'Puzzle' }) },
        { value: 'HYBRID' as TourType, label: t('tour.hybrid', { defaultValue: 'Hybrid' }) },
      ] as const,
    [t]
  );
  const hasActiveExploreFilters = Boolean(
    nearbyFilters.category || nearbyFilters.difficulty || nearbyFilters.tour_type
  );

  const activeLegendToggleTop = insets.top + 12;
  const activeLegendPanelTop = activeLegendToggleTop + 42;
  const activeLocateTop = isLegendOpen
    ? activeLegendPanelTop + legendPanelHeight + 8
    : activeLegendToggleTop + 44;
  const activeStepTop = activeLocateTop + 44;

  const legendToggleTop = insets.top + 12;
  const legendPanelTop = legendToggleTop + 42;
  const locateTopInExplore = isLegendOpen
    ? legendPanelTop + legendPanelHeight + 8
    : legendToggleTop + 44;

  useEffect(() => {
    Animated.timing(legendAnim, {
      toValue: isLegendOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isLegendOpen, legendAnim]);

  useEffect(() => {
    Animated.timing(filterPanelAnim, {
      toValue: showCategoryFilters ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showCategoryFilters, filterPanelAnim]);

  const difficultyLegendItems = useMemo(
    () => [
      {
        key: 'easy',
        color: colors.easy,
        label: t('tourDetail.easy', { defaultValue: 'Easy' }),
      },
      {
        key: 'medium',
        color: colors.medium,
        label: t('tourDetail.medium', { defaultValue: 'Medium' }),
      },
      {
        key: 'hard',
        color: colors.hard,
        label: t('tourDetail.hard', { defaultValue: 'Hard' }),
      },
    ],
    [colors.easy, colors.hard, colors.medium, t]
  );

  const completionModal = (
    <TourCompleteModal
      visible={showCompleteModal}
      tourTitle={completionSummary?.tourTitle ?? ''}
      earnedXP={completionSummary?.finalXP ?? 0}
      awardedBadges={completionSummary?.badges ?? []}
      completedSteps={completionSummary?.completedSteps ?? 0}
      totalSteps={completionSummary?.totalSteps ?? 0}
      onClose={handleCloseCompleteModal}
    />
  );

  if (!isActive || !tour) {
    return (
      <View style={styles.container}>
        <TourMap
          key={mapInstanceKey}
          markers={[]}
          route={[]}
          initialRegion={defaultRegion}
          currentStepIndex={0}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapPress={handleMapPress}
          onUserLocationReady={handleUserLocationReady}
          nearbyMarkers={nearbyMarkersForMap}
          animateToRegion={animateToRegion}
          centerOnUserRequestKey={centerOnUserRequestKey}
          mapMode={mapMode}
        />

        <Pressable
          style={[styles.locateMeButton, { top: locateTopInExplore }]}
          onPress={handleCenterOnUser}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={15} color={colors.primary} />
        </Pressable>

        {showSearchButton && (
          <>
            <View style={styles.searchControlsRow}>
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

              <Pressable
                style={[
                  styles.searchFilterButton,
                  hasActiveExploreFilters && styles.searchFilterButtonActive,
                ]}
                onPress={() => setShowCategoryFilters((prev) => !prev)}
              >
                <MaterialCommunityIcons name="filter-variant" size={14} color={colors.primary} />
                <Text style={styles.searchFilterButtonText} numberOfLines={1}>
                  {hasActiveExploreFilters
                    ? t('map.filters.active', { defaultValue: 'Filters active' })
                    : t('map.filters.label', { defaultValue: 'Filters' })}
                </Text>
              </Pressable>
            </View>

            <Animated.View
              pointerEvents={showCategoryFilters ? 'auto' : 'none'}
              style={[
                styles.searchFilterPanel,
                {
                  opacity: filterPanelAnim,
                  transform: [
                    {
                      translateY: filterPanelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                    {
                      scale: filterPanelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.searchFilterHeaderRow}>
                <Text style={styles.searchFilterPanelTitle}>
                  {t('map.filters.label', { defaultValue: 'Filters' })}
                </Text>
                <Pressable
                  style={styles.searchFilterResetButton}
                  onPress={() =>
                    handleFiltersChange({
                      ...nearbyFilters,
                      category: undefined,
                      difficulty: undefined,
                      tour_type: undefined,
                    })
                  }
                >
                  <Text style={styles.searchFilterResetButtonText}>
                    {t('map.filters.reset', { defaultValue: 'Reset' })}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.searchFilterSectionTitle}>
                {t('map.filters.type', { defaultValue: 'Tour type' })}
              </Text>
              <View style={styles.searchFilterChipsRow}>
                <Pressable
                  style={[
                    styles.searchFilterChip,
                    !nearbyFilters.tour_type && styles.searchFilterChipActive,
                  ]}
                  onPress={() => handleFiltersChange({ ...nearbyFilters, tour_type: undefined })}
                >
                  <Text
                    style={[
                      styles.searchFilterChipText,
                      !nearbyFilters.tour_type && styles.searchFilterChipTextActive,
                    ]}
                  >
                    {t('map.filters.all', { defaultValue: 'All' })}
                  </Text>
                </Pressable>
                {nearbyTourTypeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.searchFilterChip,
                      nearbyFilters.tour_type === option.value && styles.searchFilterChipActive,
                    ]}
                    onPress={() =>
                      handleFiltersChange({ ...nearbyFilters, tour_type: option.value })
                    }
                  >
                    <Text
                      style={[
                        styles.searchFilterChipText,
                        nearbyFilters.tour_type === option.value &&
                          styles.searchFilterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.searchFilterSectionTitle}>
                {t('map.filters.difficulty', { defaultValue: 'Difficulty' })}
              </Text>
              <View style={styles.searchFilterChipsRow}>
                <Pressable
                  style={[
                    styles.searchFilterChip,
                    !nearbyFilters.difficulty && styles.searchFilterChipActive,
                  ]}
                  onPress={() => handleFiltersChange({ ...nearbyFilters, difficulty: undefined })}
                >
                  <Text
                    style={[
                      styles.searchFilterChipText,
                      !nearbyFilters.difficulty && styles.searchFilterChipTextActive,
                    ]}
                  >
                    {t('map.filters.all', { defaultValue: 'All' })}
                  </Text>
                </Pressable>
                {nearbyDifficultyOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.searchFilterChip,
                      nearbyFilters.difficulty === option.value && styles.searchFilterChipActive,
                    ]}
                    onPress={() =>
                      handleFiltersChange({ ...nearbyFilters, difficulty: option.value })
                    }
                  >
                    <Text
                      style={[
                        styles.searchFilterChipText,
                        nearbyFilters.difficulty === option.value &&
                          styles.searchFilterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.searchFilterSectionTitle}>
                {t('map.filters.category', { defaultValue: 'Category' })}
              </Text>
              <View style={styles.searchFilterChipsRow}>
                <Pressable
                  style={[
                    styles.searchFilterChip,
                    !nearbyFilters.category && styles.searchFilterChipActive,
                  ]}
                  onPress={() => handleFiltersChange({ ...nearbyFilters, category: undefined })}
                >
                  <Text
                    style={[
                      styles.searchFilterChipText,
                      !nearbyFilters.category && styles.searchFilterChipTextActive,
                    ]}
                  >
                    {t('map.filters.all', { defaultValue: 'All' })}
                  </Text>
                </Pressable>
                {nearbyCategoryOptions.map((category) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.searchFilterChip,
                      nearbyFilters.category === category && styles.searchFilterChipActive,
                    ]}
                    onPress={() => handleFiltersChange({ ...nearbyFilters, category })}
                  >
                    <Text
                      style={[
                        styles.searchFilterChipText,
                        nearbyFilters.category === category && styles.searchFilterChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </>
        )}

        {!selectedNearbyTourId && (
          <>
            <Pressable
              style={[styles.legendToggleButton, { top: legendToggleTop }]}
              onPress={() => setIsLegendOpen((prev) => !prev)}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.primary} />
            </Pressable>

            <Animated.View
              pointerEvents={isLegendOpen ? 'auto' : 'none'}
              onLayout={(event) => {
                const nextHeight = Math.ceil(event.nativeEvent.layout.height);
                if (nextHeight > 0 && Math.abs(nextHeight - legendPanelHeight) > 1) {
                  setLegendPanelHeight(nextHeight);
                }
              }}
              style={[
                styles.legendCard,
                { top: legendPanelTop },
                {
                  opacity: legendAnim,
                  transform: [
                    {
                      translateY: legendAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                    {
                      scale: legendAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.legendTitle}>
                {t('map.legend.title', { defaultValue: 'Marker legend' })}
              </Text>

              <Text style={styles.legendSectionTitle}>
                {t('map.legend.typeTitle', { defaultValue: 'Tour type' })}
              </Text>
              <View style={styles.legendRow}>
                {markerLegendItems.map((item) => (
                  <View key={item.key} style={styles.legendItem}>
                    <View style={styles.legendIconBadge}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={12}
                        color={colors.background}
                      />
                    </View>
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.legendSectionTitle}>
                {t('map.legend.difficultyTitle', { defaultValue: 'Difficulty color' })}
              </Text>
              <View style={styles.legendRow}>
                {difficultyLegendItems.map((item) => (
                  <View key={item.key} style={styles.legendItem}>
                    <View style={[styles.legendColorDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.legendSectionTitle}>
                {t('map.legend.controlsTitle', { defaultValue: 'Controls' })}
              </Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={styles.legendIconBadge}>
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={12}
                      color={colors.background}
                    />
                  </View>
                  <Text style={styles.legendText}>
                    {t('map.legend.controls.myLocation', { defaultValue: 'My location' })}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={styles.legendIconBadge}>
                    <MaterialCommunityIcons name="magnify" size={12} color={colors.background} />
                  </View>
                  <Text style={styles.legendText}>
                    {t('map.legend.controls.searchHere', { defaultValue: 'Search this area' })}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        <TourPreviewPanel
          tour={selectedTour}
          onClose={handlePreviewClose}
          onViewTour={handlePreviewViewTour}
        />

        <NearbyToursSlider
          tours={nearbyTours as unknown as Tour[]}
          loading={nearbyLoading}
          onTourPress={handleNearbyTourPress}
          onTourView={handlePreviewViewTour}
          onInteraction={() => setShowCategoryFilters(false)}
          mapVisibleTourIds={mapVisibleTourIds}
          sortBy={nearbySort}
          onSortChange={handleSortChange}
          hidden={!!selectedNearbyTourId}
        />
        {completionModal}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TourMap
        key={mapInstanceKey}
        markers={visibleMarkers}
        route={visibleRoute}
        initialRegion={initialRegion}
        currentStepIndex={currentStepIndex}
        tour={tour}
        animateToRegion={animateToRegion}
        centerOnUserRequestKey={centerOnUserRequestKey}
        mapMode={mapMode}
      />

      <Pressable
        style={[styles.legendToggleButton, { top: activeLegendToggleTop }]}
        onPress={() => setIsLegendOpen((prev) => !prev)}
      >
        <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.primary} />
      </Pressable>

      <Animated.View
        pointerEvents={isLegendOpen ? 'auto' : 'none'}
        onLayout={(event) => {
          const nextHeight = Math.ceil(event.nativeEvent.layout.height);
          if (nextHeight > 0 && Math.abs(nextHeight - legendPanelHeight) > 1) {
            setLegendPanelHeight(nextHeight);
          }
        }}
        style={[
          styles.legendCard,
          { top: activeLegendPanelTop },
          {
            opacity: legendAnim,
            transform: [
              {
                translateY: legendAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
              {
                scale: legendAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.legendTitle}>
          {t('map.activeTour.legend.title', { defaultValue: 'Tour legend' })}
        </Text>

        <Text style={styles.legendSectionTitle}>
          {t('map.activeTour.legend.steps', { defaultValue: 'Step type' })}
        </Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendIconBadge}>
              <MaterialCommunityIcons name="book-outline" size={12} color="#fff" />
            </View>
            <Text style={styles.legendText}>
              {t('map.activeTour.legend.story', { defaultValue: 'Story step' })}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendIconBadge}>
              <MaterialCommunityIcons name="puzzle" size={12} color="#fff" />
            </View>
            <Text style={styles.legendText}>
              {t('map.activeTour.legend.puzzle', { defaultValue: 'Puzzle step' })}
            </Text>
          </View>
        </View>

        <Text style={styles.legendSectionTitle}>
          {t('map.activeTour.legend.status', { defaultValue: 'Marker status' })}
        </Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColorDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>
              {t('map.activeTour.legend.current', { defaultValue: 'Current step (larger)' })}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColorDot, { backgroundColor: colors.subText, opacity: 0.6 }]}
            />
            <Text style={styles.legendText}>
              {t('map.activeTour.legend.upcoming', { defaultValue: 'Upcoming step (dimmed)' })}
            </Text>
          </View>
        </View>

        <Text style={styles.legendSectionTitle}>
          {t('map.activeTour.legend.controlsTitle', { defaultValue: 'Controls' })}
        </Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendIconBadge}>
              <MaterialCommunityIcons name="crosshairs-gps" size={12} color={colors.background} />
            </View>
            <Text style={styles.legendText}>
              {t('map.activeTour.legend.myLocation', { defaultValue: 'My location' })}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendIconBadge}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.background} />
            </View>
            <Text style={styles.legendText}>
              {t('map.activeTour.legend.currentStep', { defaultValue: 'Go to current step' })}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Pressable
        style={[styles.locateMeButton, { top: activeLocateTop }]}
        onPress={handleCenterOnUser}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={15} color={colors.primary} />
      </Pressable>

      <Pressable
        style={[styles.focusStepButton, { top: activeStepTop }]}
        onPress={handleFocusCurrentStep}
      >
        <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
      </Pressable>

      <BottomSlider
        tour={tour}
        onEndTour={handleEndTourPress}
        onTourComplete={handleTourComplete}
      />

      <EndTourConfirmModal
        visible={showEndConfirmModal}
        earnedXP={earnedXP}
        completedSteps={completedStepsForEndTour}
        totalSteps={tour.steps.length}
        onConfirm={handleConfirmEndTour}
        onCancel={handleCancelEndTour}
      />
      {completionModal}
    </View>
  );
}
