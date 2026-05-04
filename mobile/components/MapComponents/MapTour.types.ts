import type { Difficulty, TourType } from '@/api/tours';

export type MapTour = {
  id: number;
  title: string;
  category?: string;
  difficulty: Difficulty;
  tour_type: TourType;
  duration_minutes: number;
  cover_image?: string;
  average_rating?: number;
  review_count?: number;
  created_at?: string;
  first_lat?: number | null;
  first_lng?: number | null;
};
