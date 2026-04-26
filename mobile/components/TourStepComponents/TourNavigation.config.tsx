import { Tour, TourStep } from './TourStep.config';
import { MapMarkerProps } from '../MapComponents/MapMarker.config';
import { markerColors } from '@/constants/Colors';
import { getFirstPuzzleIndex } from '@/utils/tourStepVisibility';

export interface TourNavigationProps {
  tour: Tour;
  currentStepIndex: number;
  solvedSteps: Set<string>;
  locationConfirmedSteps: Set<string>;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  onStepSolved: (stepId: string) => void;
  onLocationConfirm: (stepId: string, latitude: number, longitude: number) => Promise<void>;
  onEndTour?: () => void;
  onSkipStep?: () => void;
}

export interface ProgressBarProps {
  totalSteps: number;
  currentStep: number;
  solvedSteps: Set<string>;
  stepIds: string[];
}

export interface NavigationArrowsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  isForwardLocked: boolean;
  requiresLocation: boolean;
  isLocationConfirmed: boolean;
  onLocationConfirm: () => Promise<void>;
  isLastStep: boolean;
}

function getActiveTourRevealLimit(
  tour: Tour,
  currentStepIndex: number,
  solvedSteps: Set<string>,
  locationConfirmedSteps: Set<string>
): number {
  const lastStepIndex = tour.steps.length - 1;
  const firstPuzzleIndex = getFirstPuzzleIndex(tour.steps, (step) => step.type === 'puzzle');
  const firstPuzzleLimit = firstPuzzleIndex === -1 ? lastStepIndex : firstPuzzleIndex;
  const currentIndex = Math.min(currentStepIndex, lastStepIndex);
  const currentStep = tour.steps[currentIndex];
  const canRevealNext =
    currentStep?.type === 'puzzle' &&
    solvedSteps.has(currentStep.id) &&
    locationConfirmedSteps.has(currentStep.id);
  const progressLimit = canRevealNext ? currentIndex + 1 : currentIndex;

  return Math.min(Math.max(firstPuzzleLimit, progressLimit), lastStepIndex);
}

export function getVisibleMarkers(
  tour: Tour,
  currentStepIndex: number,
  solvedSteps: Set<string>,
  locationConfirmedSteps: Set<string>
): MapMarkerProps[] {
  const revealLimit = getActiveTourRevealLimit(
    tour,
    currentStepIndex,
    solvedSteps,
    locationConfirmedSteps
  );
  const visibleSteps = tour.steps.slice(0, revealLimit + 1);
  const visibleCurrentStepIndex = Math.min(currentStepIndex, revealLimit);

  return visibleSteps.map((step, i) => {
    const isCurrent = i === visibleCurrentStepIndex;
    const isSolved = solvedSteps.has(step.id);
    const isPast = i < visibleCurrentStepIndex;

    return {
      id: step.id,
      coordinate: step.coordinate,
      title: step.title,
      iconType: step.type === 'puzzle' ? 'puzzle' : 'story',
      circleSize: isCurrent ? 48 : 40,
      circleColor: markerColors[i % markerColors.length],
      // Dim future unsolved steps slightly
      opacity: isPast || isCurrent || isSolved ? 1 : 0.6,
    };
  });
}

export function getVisibleRoute(
  tour: Tour,
  currentStepIndex: number,
  solvedSteps: Set<string>,
  locationConfirmedSteps: Set<string>
): { latitude: number; longitude: number }[] {
  const revealLimit = getActiveTourRevealLimit(
    tour,
    currentStepIndex,
    solvedSteps,
    locationConfirmedSteps
  );
  const visibleSteps = tour.steps.slice(0, revealLimit + 1);
  const visibleCurrentStepIndex = Math.min(currentStepIndex, revealLimit);
  const route: { latitude: number; longitude: number }[] = [];

  for (let i = 0; i < revealLimit; i++) {
    const step = visibleSteps[i];
    const nextStep = visibleSteps[i + 1];

    const currentVisible = step.type !== 'puzzle' || solvedSteps.has(step.id);
    const nextVisible =
      i + 1 <= revealLimit ||
      nextStep.type !== 'puzzle' ||
      solvedSteps.has(nextStep.id);

    if (currentVisible && route.length === 0) {
      route.push(step.coordinate);
    }

    if (currentVisible && nextVisible) {
      if (route.length === 0) {
        route.push(step.coordinate);
      }
      route.push(nextStep.coordinate);
    }
  }

  if (route.length > 0) {
    const currentStep = visibleSteps[visibleCurrentStepIndex];
    const lastCoord = route[route.length - 1];
    if (
      lastCoord.latitude !== currentStep.coordinate.latitude ||
      lastCoord.longitude !== currentStep.coordinate.longitude
    ) {
      route.push(currentStep.coordinate);
    }
  }

  return route;
}

export function canNavigateForward(
  currentStep: TourStep,
  currentStepIndex: number,
  totalSteps: number,
  solvedSteps: Set<string>,
  locationConfirmedSteps: Set<string>
): boolean {
  if (currentStepIndex >= totalSteps - 1) {
    return false;
  }

  if (currentStep.type === 'puzzle') {
    if (!solvedSteps.has(currentStep.id)) {
      return false;
    }
  }

  if (currentStep.requiresLocationConfirmation === true) {
    if (!locationConfirmedSteps.has(currentStep.id)) {
      return false;
    }
  }

  return true;
}

export function canNavigateBackward(currentStepIndex: number): boolean {
  return currentStepIndex > 0;
}
