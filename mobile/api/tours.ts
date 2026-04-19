import { apiRequest } from './APIClient';
import { User } from './users';

// Types
export type TourType = 'STORY' | 'PUZZLE' | 'HYBRID';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TourStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type Puzzle = {
  id?: number;
  puzzle_type: 'TRIVIA' | 'AR' | 'GYROSCOPE';
  question: string;
  options?: string[];
  correct_answer?: string; // Used when creating/updating, hidden in response
  hint: string;
  xp_reward: number;
};

export type TourStep = {
  id: number;
  order: number;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  image?: string;
  audio?: string;
  puzzle?: Puzzle;
};

export type Review = {
  id: number;
  user: User;
  rating: number;
  comment: string;
  created_at: string;
};

export type Tour = {
  id: number;
  title: string;
  description: string;
  creator: User;
  tour_type: TourType;
  category: string;
  difficulty: Difficulty;
  duration_minutes: number;
  total_distance?: number;
  is_premium: boolean;
  city: string;
  status: TourStatus;
  created_at: string;
  updated_at: string;
  steps: TourStep[];
  reviews: Review[];
  average_rating?: number;
};

export type ToursResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tour[];
};

export type TourFilters = {
  search?: string;
  city?: string;
  difficulty?: Difficulty;
  tour_type?: TourType;
  is_premium?: boolean;
  status?: TourStatus;
  min_distance?: number;
  max_distance?: number;
  min_duration?: number;
  max_duration?: number;
  min_accessibility?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
};

// API Functions

/**
 * Fetch all tours with optional filters and search
 */
export async function getTours(
  filters?: TourFilters,
  signal?: AbortSignal
): Promise<ToursResponse> {
  const params: Record<string, any> = {};

  if (filters) {
    if (filters.search) params.search = filters.search;
    if (filters.city) params.city = filters.city;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.tour_type) params.tour_type = filters.tour_type;
    if (filters.is_premium !== undefined) params.is_premium = filters.is_premium;
    if (filters.status) params.status = filters.status;
    if (filters.min_distance) params.min_distance = filters.min_distance;
    if (filters.max_distance) params.max_distance = filters.max_distance;
    if (filters.min_duration) params.min_duration = filters.min_duration;
    if (filters.max_duration) params.max_duration = filters.max_duration;
    if (filters.min_accessibility) params.min_accessibility = filters.min_accessibility;
    if (filters.ordering) params.ordering = filters.ordering;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
  }

  return apiRequest<ToursResponse>({
    method: 'GET',
    url: '/api/tours/',
    params,
    auth: false, // Public endpoint
    signal,
  });
}

/**
 * Fetch a single tour by ID
 */
export async function getTour(tourId: number, signal?: AbortSignal): Promise<Tour> {
  return apiRequest<Tour>({
    method: 'GET',
    url: `/api/tours/${tourId}/`,
    auth: false, // Public endpoint
    signal,
  });
}

/**
 * Search tours by query string
 */
export async function searchTours(
  query: string,
  filters?: Omit<TourFilters, 'search'>,
  signal?: AbortSignal
): Promise<ToursResponse> {
  return getTours({ ...filters, search: query }, signal);
}

/**
 * Fetch tours by city
 */
export async function getToursByCity(
  city: string,
  filters?: Omit<TourFilters, 'city'>,
  signal?: AbortSignal
): Promise<ToursResponse> {
  return getTours({ ...filters, city }, signal);
}

/**
 * Fetch tours by category
 */
export async function getToursByCategory(
  category: string,
  filters?: TourFilters,
  signal?: AbortSignal
): Promise<ToursResponse> {
  return getTours({ ...filters, search: category }, signal);
}

/**
 * Fetch tours by difficulty
 */
export async function getToursByDifficulty(
  difficulty: Difficulty,
  filters?: Omit<TourFilters, 'difficulty'>,
  signal?: AbortSignal
): Promise<ToursResponse> {
  return getTours({ ...filters, difficulty }, signal);
}

/**
 * Fetch tours by type
 */
export async function getToursByType(
  tourType: TourType,
  filters?: Omit<TourFilters, 'tour_type'>,
  signal?: AbortSignal
): Promise<ToursResponse> {
  return getTours({ ...filters, tour_type: tourType }, signal);
}

/**
 * Create a new tour (requires authentication)
 */
export async function createTour(tourData: Partial<Tour>, signal?: AbortSignal): Promise<Tour> {
  return apiRequest<Tour, Partial<Tour>>({
    method: 'POST',
    url: '/api/tours/',
    data: tourData,
    auth: true,
    signal,
  });
}

/**
 * Update an existing tour (requires authentication)
 */
export async function updateTour(
  tourId: number,
  tourData: Partial<Tour>,
  signal?: AbortSignal
): Promise<Tour> {
  return apiRequest<Tour, Partial<Tour>>({
    method: 'PATCH',
    url: `/api/tours/${tourId}/`,
    data: tourData,
    auth: true,
    signal,
  });
}

/**
 * Delete a tour (requires authentication)
 */
export async function deleteTour(tourId: number, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>({
    method: 'DELETE',
    url: `/api/tours/${tourId}/`,
    auth: true,
    signal,
  });
}

/**
 * Fetch tour steps for a specific tour
 */
export async function getTourSteps(tourId: number, signal?: AbortSignal): Promise<TourStep[]> {
  return apiRequest<TourStep[]>({
    method: 'GET',
    url: `/api/tours/${tourId}/steps/`,
    auth: false,
    signal,
  });
}

/**
 * Fetch reviews for a specific tour
 */
export async function getTourReviews(tourId: number, signal?: AbortSignal): Promise<Review[]> {
  return apiRequest<Review[]>({
    method: 'GET',
    url: `/api/tours/${tourId}/reviews/`,
    auth: false,
    signal,
  });
}

/**
 * Add a review to a tour (requires authentication)
 */
export async function addTourReview(
  tourId: number,
  reviewData: { rating: number; comment: string },
  signal?: AbortSignal
): Promise<Review> {
  return apiRequest<Review, typeof reviewData>({
    method: 'POST',
    url: `/api/tours/${tourId}/reviews/`,
    data: reviewData,
    auth: true,
    signal,
  });
}

export async function updateTourReview(
  tourId: number,
  reviewId: number,
  reviewData: { rating: number; comment: string },
  signal?: AbortSignal
): Promise<Review> {
  return apiRequest<Review, typeof reviewData>({
    method: 'PATCH',
    url: `/api/tours/${tourId}/reviews/${reviewId}/`,
    data: reviewData,
    auth: true,
    signal,
  });
}

/**
 * Fetch the current user's tours (requires authentication)
 * @param status - Optional filter by tour status (DRAFT, PUBLISHED, ARCHIVED)
 */
export async function getMyTours(
  status?: TourStatus,
  signal?: AbortSignal
): Promise<ToursResponse> {
  const params: Record<string, any> = {};
  if (status) params.status = status;

  return apiRequest<ToursResponse>({
    method: 'GET',
    url: '/api/tours/my-tours/',
    params,
    auth: true,
    signal,
  });
}

/**
 * Fetch the current user's completed tours (requires authentication)
 * @param status - Optional filter by tour status (PUBLISHED or ARCHIVED)
 */
export async function getMyCompletedTours(
  status?: TourStatus,
  signal?: AbortSignal
): Promise<ToursResponse> {
  const params: Record<string, any> = {};
  if (status) params.status = status;

  return apiRequest<ToursResponse>({
    method: 'GET',
    url: '/api/tours/my-completed-tours/',
    params,
    auth: true,
    signal,
  });
}

/**
 * Add a step to a tour (requires authentication)
 */
export async function createTourStep(
  tourId: number,
  stepData: Partial<TourStep>,
  signal?: AbortSignal
): Promise<TourStep> {
  let data: Partial<TourStep> | FormData = stepData;

  if (stepData.image && stepData.image.startsWith('file://')) {
    const formData = new FormData();
    Object.keys(stepData).forEach((key) => {
      const k = key as keyof TourStep;
      if (stepData[k] !== undefined && stepData[k] !== null) {
        if (k === 'image') {
          formData.append('image', {
            uri: stepData.image,
            name: 'step_image.jpg',
            type: 'image/jpeg',
          } as any);
        } else {
          formData.append(k, String(stepData[k]));
        }
      }
    });
    data = formData;
  } else if (!stepData.image) {
    // If image is empty string or undefined/null, ensure we don't send it to avoid backend validation error (400)
    // because Django ImageField doesn't like empty strings.
    const { image, ...rest } = stepData;
    data = rest;
  }

  return apiRequest<TourStep, typeof data>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/`,
    data,
    auth: true,
    signal,
  });
}
