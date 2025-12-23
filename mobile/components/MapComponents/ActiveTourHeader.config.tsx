import { Tour } from '@/components/TourStepComponents/TourStep.config';

export interface ActiveTourHeaderProps {
  tour: Tour;
  currentStepIndex: number;
  solvedSteps: Set<string>;
  earnedXP: number;
  onEndTour: () => void;
}

export interface ActiveTourHeaderConfig {
  showXPBadge: boolean;
  showProgressBar: boolean;
  showStepDots: boolean;
}

export const defaultConfig: ActiveTourHeaderConfig = {
  showXPBadge: true,
  showProgressBar: true,
  showStepDots: true,
};
