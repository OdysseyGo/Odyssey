import { Tour } from '../TourStepComponents/TourStep.config';

export interface BottomSliderProps {
  tour: Tour;
  onCurrentStepChange?: (stepIndex: number) => void;
  onSolvedStepsChange?: (solvedSteps: Set<string>) => void;
  onEndTour?: () => void;
  initialStepIndex?: number;
  initialSolvedSteps?: Set<string>;
}

export interface BottomSliderConfig {
  enableSwipeGestures: boolean;
  showProgressIndicator: boolean;
}
