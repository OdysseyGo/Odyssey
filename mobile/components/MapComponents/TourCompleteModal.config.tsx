import { Tour } from '@/components/TourStepComponents/TourStep.config';
import type { UserBadge } from '@/api/profile';

export interface TourCompleteModalProps {
  visible: boolean;
  tour: Tour;
  earnedXP: number;
  awardedBadges?: UserBadge[];
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
