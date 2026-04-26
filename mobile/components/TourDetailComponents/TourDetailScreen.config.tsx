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
  }));

  const difficultyMap: Record<string, TourDetail['difficulty']> = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
  };

  const hasDistance = tour.total_distance != null && tour.total_distance > 0;

  return {
    id: tour.id.toString(),
    title: tour.title,
    description: tour.description,
    author: tour.creator?.username || 'Unknown',
    authorId: tour.creator?.id || 0,
    authorAvatar: tour.creator?.avatar_url || '',
    coverImage: tour.steps?.[0]?.image || `https://picsum.photos/800/400?random=${tour.id}`,
    duration: `${tour.duration_minutes} ${t('tourId.min')}`,
    distance: hasDistance ? `${(tour.total_distance! / 1000).toFixed(1)} km` : '—',
    rating: tour.average_rating || 0.0,
    reviewCount: tour.reviews?.length || 0,
    difficulty: difficultyMap[tour.difficulty] || 'Medium',
    stops,
    tags: [tour.category, tour.tour_type, tour.city].filter(Boolean),
    elevationGain: tour.elevation_gain ?? 0,
    requiresTransport: tour.requires_transport ?? false,
    isCircular: tour.is_circular ?? false,
    accessibilityRating: tour.accessibility_rating ?? 0,
    metricsCalculated: tour.metrics_calculated ?? hasDistance,
  };
}
