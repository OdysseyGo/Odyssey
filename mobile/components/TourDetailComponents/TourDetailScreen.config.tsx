import { Tour } from '@/api/tours';
import { TourDetail, TourStop } from './TourDetail.config';

export interface TourDetailScreenProps {
  tourId: string;
}

/**
 * Maps API Tour response to component TourDetail type
 */
export function mapApiTourToDetail(tour: Tour, t: (key: string) => string): TourDetail {
  const stops: TourStop[] = (tour.steps || []).map((step) => ({
    id: step.id.toString(),
    title: step.title,
    description: step.description,
    latitude: parseFloat(step.latitude),
    longitude: parseFloat(step.longitude),
    order: step.order,
    hasPuzzle: Boolean(step.puzzle),
  }));

  const difficultyMap: Record<string, TourDetail['difficulty']> = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
  };

  return {
    id: tour.id.toString(),
    title: tour.title,
    description: tour.description,
    author: tour.creator?.username || 'Unknown',
    authorId: tour.creator?.id || 0,
    authorAvatar: tour.creator?.avatar_url || '',
    coverImage: tour.steps?.[0]?.image || `https://picsum.photos/800/400?random=${tour.id}`,
    duration: `${tour.duration_minutes} ${t('tourId.min')}`,
    distance:
      tour.total_distance != null && tour.total_distance > 0
        ? `${(tour.total_distance / 1000).toFixed(1)} km`
        : 'N/A',
    rating: tour.average_rating || 0.0,
    reviewCount: tour.reviews?.length || 0,
    difficulty: difficultyMap[tour.difficulty] || 'Medium',
    stops,
    tags: [tour.category, tour.tour_type, tour.city].filter(Boolean),
  };
}
