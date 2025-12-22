import { Tour } from '@/components/TourStepComponents/TourStep.config';

export interface TourCompleteModalProps {
  visible: boolean;
  tour: Tour;
  earnedXP: number;
  completedSteps: number;
  totalSteps: number;
  onClose: () => void;
}

export interface TourCompletionStats {
  totalXP: number;
  puzzlesSolved: number;
  timeSpent: string;
  accuracy: number;
}
