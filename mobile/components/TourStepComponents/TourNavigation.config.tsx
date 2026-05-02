import { Tour, TourStep } from './TourStep.config';
import { MapMarkerProps } from '../MapComponents/MapMarker.config';
import { markerColors } from '@/constants/Colors';

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

  if (lastStepIndex < 0 || tour.hasCompletedOnce) {
    return lastStepIndex;
  }

  const currentIndex = Math.min(currentStepIndex, lastStepIndex);
  const currentStep = tour.steps[currentIndex];
  const canRevealNext =
    currentStep?.type === 'puzzle' &&
    solvedSteps.has(currentStep.id) &&
    locationConfirmedSteps.has(currentStep.id);
  const revealFromIndex = Math.min(canRevealNext ? currentIndex + 1 : currentIndex, lastStepIndex);
  const nextPuzzleOffset = tour.steps
    .slice(revealFromIndex)
    .findIndex((step) => step.type === 'puzzle');

  return nextPuzzleOffset === -1 ? lastStepIndex : revealFromIndex + nextPuzzleOffset;
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

  return visibleSteps.map((step) => step.coordinate);
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
