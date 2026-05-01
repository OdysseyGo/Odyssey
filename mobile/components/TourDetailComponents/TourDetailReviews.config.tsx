import { Review } from '@/api/tours';

export interface TourDetailReviewsProps {
  tourId: number;
}

export interface TourDetailReviewsState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  requiresLogin: boolean;
}
