import { Tour, exampleTour } from '../TourStepComponents/TourStep.config';

export interface BottomSliderProps {
  tour: Tour;
  onCurrentStepChange?: (stepIndex: number) => void;
  onSolvedStepsChange?: (solvedSteps: Set<string>) => void;
}

export const exampleBottomSlider: BottomSliderProps = {
  tour: exampleTour,
};
