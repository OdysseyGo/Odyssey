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
}

export function getVisibleMarkers(
  tour: Tour,
  currentStepIndex: number,
  solvedSteps: Set<string>
): MapMarkerProps[] {
  const markers: MapMarkerProps[] = [];

  for (let i = 0; i <= currentStepIndex; i++) {
    const step = tour.steps[i];
    const isPuzzle = step.type === 'puzzle';
    const isSolved = solvedSteps.has(step.id);
    const isCurrent = i === currentStepIndex;

    // For puzzle steps, only show if solved OR if it's the current step
    // For story steps, always show if we've reached that point
    if (!isPuzzle || isSolved || isCurrent) {
      markers.push({
        id: step.id,
        coordinate: step.coordinate,
        title: step.title,
        iconType: step.type === 'puzzle' ? 'puzzle' : 'story',
        circleSize: isCurrent ? 48 : 40,
        circleColor: markerColors[i % markerColors.length],
      });
    }
  }

  return markers;
}

export function getVisibleRoute(
  tour: Tour,
  currentStepIndex: number,
  solvedSteps: Set<string>
): { latitude: number; longitude: number }[] {
  const route: { latitude: number; longitude: number }[] = [];

  for (let i = 0; i < currentStepIndex; i++) {
    const step = tour.steps[i];
    const nextStep = tour.steps[i + 1];

    const currentVisible = step.type !== 'puzzle' || solvedSteps.has(step.id);
    const nextVisible =
      i + 1 === currentStepIndex || nextStep.type !== 'puzzle' || solvedSteps.has(nextStep.id);

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
    const currentStep = tour.steps[currentStepIndex];
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
