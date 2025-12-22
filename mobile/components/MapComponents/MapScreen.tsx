import { View, Text } from 'react-native';
import { useMemo, useState, useCallback, useEffect } from 'react';

import getStyles from './MapScreen.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import BottomSlider from './BottomSlider';
import TourMap from './TourMap';
import TourCompleteModal from './TourCompleteModal';
import EndTourConfirmModal from './EndTourConfirmModal';
import { getVisibleMarkers, getVisibleRoute } from '../TourStepComponents/TourNavigation.config';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import Colors from '@/constants/Colors';

export default function MapScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];

  // Active tour context
  const {
    tour,
    isActive,
    currentStepIndex,
    solvedSteps,
    earnedXP,
    setCurrentStepIndex,
    solveStep,
    confirmLocation,
    endTour,
    resetProgress,
  } = useActiveTour();

  // Local state for modals
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [localSolvedSteps, setLocalSolvedSteps] = useState<Set<string>>(new Set());

  // Merge context solved steps with local for UI updates
  const mergedSolvedSteps = useMemo(() => {
    const merged = new Set(solvedSteps);
    localSolvedSteps.forEach((id) => merged.add(id));
    return merged;
  }, [solvedSteps, localSolvedSteps]);

  // Calculate visible markers and routes for active tour
  const visibleMarkers = useMemo(() => {
    if (!tour || !isActive) return [];
    return getVisibleMarkers(tour, currentStepIndex, mergedSolvedSteps);
  }, [tour, isActive, currentStepIndex, mergedSolvedSteps]);

  const visibleRoute = useMemo(() => {
    if (!tour || !isActive) return [];
    return getVisibleRoute(tour, currentStepIndex, mergedSolvedSteps);
  }, [tour, isActive, currentStepIndex, mergedSolvedSteps]);

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

  const handleCurrentStepChange = useCallback(
    (stepIndex: number) => {
      setCurrentStepIndex(stepIndex);
    },
    [setCurrentStepIndex]
  );

  const handleSolvedStepsChange = useCallback(
    (newSolvedSteps: Set<string>) => {
      setLocalSolvedSteps(newSolvedSteps);
      // Sync with context - find newly solved steps and add XP
      newSolvedSteps.forEach((stepId) => {
        if (!solvedSteps.has(stepId)) {
          solveStep(stepId, 15); // Award 15 XP per solved puzzle
        }
      });
    },
    [solvedSteps, solveStep]
  );

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

  // Effect to check for tour completion when all puzzles are solved and on last step
  useEffect(() => {
    if (!tour || showCompleteModal) return;

    const totalPuzzles = tour.steps.filter((s) => s.type === 'puzzle').length;
    const solvedPuzzles = mergedSolvedSteps.size;

    // Check if on last step and all puzzles solved
    if (
      currentStepIndex === tour.steps.length - 1 &&
      solvedPuzzles >= totalPuzzles &&
      totalPuzzles > 0
    ) {
      // All puzzles solved and on last step - show completion modal after a short delay
      const timer = setTimeout(() => {
        setShowCompleteModal(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tour, currentStepIndex, mergedSolvedSteps, showCompleteModal]);

  // Default region (e.g., Istanbul)
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
        onCurrentStepChange={handleCurrentStepChange}
        onSolvedStepsChange={handleSolvedStepsChange}
        onEndTour={handleEndTourPress}
      />

      {/* End Tour Confirmation Modal */}
      <EndTourConfirmModal
        visible={showEndConfirmModal}
        earnedXP={earnedXP}
        completedSteps={mergedSolvedSteps.size}
        totalSteps={tour.steps.length}
        onConfirm={handleConfirmEndTour}
        onCancel={handleCancelEndTour}
      />

      {/* Tour Complete Modal */}
      <TourCompleteModal
        visible={showCompleteModal}
        tour={tour}
        earnedXP={earnedXP}
        completedSteps={mergedSolvedSteps.size}
        totalSteps={tour.steps.length}
        onClose={handleCloseCompleteModal}
      />
    </View>
  );
}
