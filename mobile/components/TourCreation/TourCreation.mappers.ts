import { Tour } from '@/api/tours';
import { Puzzle, TourCreationData, TourLocation } from './TourCreation.types';

function mapApiPuzzleToCreationPuzzle(
  puzzle?: Tour['steps'][number]['puzzle']
): Puzzle | undefined {
  if (!puzzle) {
    return undefined;
  }

  return {
    puzzle_type: puzzle.puzzle_type,
    question: puzzle.question,
    options: puzzle.options ?? [],
    correctAnswer: puzzle.correct_answer ?? '',
    hint: puzzle.hint,
    xp_reward: puzzle.xp_reward,
  };
}

export function mapApiTourToCreationData(tour: Tour): TourCreationData {
  const locations: TourLocation[] = [...(tour.steps ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({
      id: `step_${step.id}`,
      backendStepId: step.id,
      latitude: Number.parseFloat(step.latitude),
      longitude: Number.parseFloat(step.longitude),
      title: step.title,
      address: '',
      story: step.description ?? '',
      order: step.order ?? index + 1,
      image: step.image,
      puzzle: mapApiPuzzleToCreationPuzzle(step.puzzle),
    }));

  return {
    title: tour.title,
    description: tour.description,
    category: tour.category,
    difficulty: tour.difficulty,
    tourType: tour.tour_type,
    estimatedDuration: tour.duration_minutes,
    locations,
    country: tour.country ?? '',
    countryCode: tour.country_code ?? '',
    state: tour.city ?? '',
    stateLatitude: tour.city_latitude,
    stateLongitude: tour.city_longitude,
  };
}

export function getApiTourStepIds(tour: Tour): number[] {
  return (tour.steps ?? []).map((step) => step.id);
}
