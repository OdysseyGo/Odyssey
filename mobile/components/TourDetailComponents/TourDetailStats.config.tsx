import { TourDetail } from './TourDetail.config';

export interface TourDetailStatsProps {
  duration: string;
  distance: string;
  difficulty: TourDetail['difficulty'];
}
