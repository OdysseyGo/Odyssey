import { TourDetail } from './TourDetail.config';

export interface TourDetailStatsProps {
  duration: string;
  distance: string;
  difficulty: TourDetail['difficulty'];
  elevationGain?: number;
  requiresTransport?: boolean;
  isCircular?: boolean;
  accessibilityRating?: number;
  metricsCalculated?: boolean;
}
