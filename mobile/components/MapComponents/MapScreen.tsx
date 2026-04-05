import { View } from 'react-native';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import getStyles from './MapScreen.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import BottomSlider from './BottomSlider';
import TourMap from './TourMap';
import TourCompleteModal from './TourCompleteModal';
import EndTourConfirmModal from './EndTourConfirmModal';
import { getVisibleMarkers, getVisibleRoute } from '../TourStepComponents/TourNavigation.config';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import Colors from '@/constants/Colors';

import { getTourProgress } from '@/api/tourProgress';

export default function MapScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];

  // Active tour context
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

  // Local state for modals and final backend data
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [finalXP, setFinalXP] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      resumeActiveTour();

      return () => {};
    }, [resumeActiveTour])
  );

  // Calculate visible markers and routes for active tour
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
      // Default region (e.g., Istanbul)
      return {
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return {
      latitude: tour.steps[0].coordinate.latitude,
      longitude: tour.steps[0].coordinate.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [tour, isActive]);

  // This gets called ONLY when the "Next" button is pressed on the final step
  const handleTourComplete = useCallback(async () => {
    if (progressId) {
      try {
        // Fetch the authoritative final progress from the backend
        const progress = await getTourProgress(progressId);
        setFinalXP(progress.total_xp);
      } catch (error) {
        console.error('Failed to fetch final tour progress:', error);
        // Fallback to local XP if the API fails for some reason
        setFinalXP(earnedXP);
      }
    } else {
      setFinalXP(earnedXP);
    }

    setShowCompleteModal(true);
  }, [progressId, earnedXP]);

  const handleEndTourPress = useCallback(() => {
    setShowEndConfirmModal(true);
  }, []);

  const handleConfirmEndTour = useCallback(() => {
    setShowEndConfirmModal(false);
    // User confirmed they want to exit - just end the tour without completion modal
    // Tour is NOT completed, user is just exiting early
    endTour();
  }, [endTour]);

  const handleCancelEndTour = useCallback(() => {
    setShowEndConfirmModal(false);
  }, []);

  const handleCloseCompleteModal = useCallback(() => {
    setShowCompleteModal(false);
    endTour();
  }, [endTour]);

  const defaultRegion = useMemo(
    () => ({
      latitude: 41.0082,
      longitude: 28.9784,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    []
  );

  // No active tour - show just the map
  if (!isActive || !tour) {
    return (
      <View style={styles.container}>
        <TourMap markers={[]} route={[]} initialRegion={defaultRegion} currentStepIndex={0} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map with tour markers and route */}
      <TourMap
        markers={visibleMarkers}
        route={visibleRoute}
        initialRegion={initialRegion}
        currentStepIndex={currentStepIndex}
        tour={tour}
      />

      {/* Bottom Navigation Slider */}
      <BottomSlider
        tour={tour}
        onEndTour={handleEndTourPress}
        onTourComplete={handleTourComplete}
      />

      {/* End Tour Confirmation Modal */}
      <EndTourConfirmModal
        visible={showEndConfirmModal}
        earnedXP={earnedXP}
        completedSteps={solvedSteps.size}
        totalSteps={tour.steps.length}
        onConfirm={handleConfirmEndTour}
        onCancel={handleCancelEndTour}
      />

      {/* Tour Complete Modal */}
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
