import { ApiError, apiRequest } from './APIClient';
import { User } from './users';

// Types
export type TourType = 'STORY' | 'PUZZLE' | 'HYBRID';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TourStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type TourGenerationSource = 'USER' | 'AI';

export type TriviaPuzzleDetail = {
  options: string[];
  correct_answer: string;
};

export type PictureComparePuzzleDetail = {
  reference_image: string;
  similarity_threshold: number;
};

export type ArPuzzleDetail = {
  scene_asset_url?: string;
  metadata?: Record<string, any>;
};

export type ARModelAnchor = {
  id: string;
  label: string;
  description?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
  scale?: {
    x: number;
    y: number;
    z: number;
  };
};

export type ARModel = {
  id: number;
  slug: string;
  name: string;
  preview_image_url: string;
  scene_asset_url: string;
  anchors: ARModelAnchor[];
};

export type CompassPuzzleDetail = {
  target_heading_degrees: number;
};

export type OpenEndedPuzzleDetail = {
  answer_type: 'text' | string;
};

export type Puzzle = {
  id?: number;
  puzzle_type: 'TRIVIA' | 'OPEN_ENDED' | 'AR' | 'PICTURE_COMPARE' | 'COMPASS';
  question: string;
  hint: string;
  xp_reward: number;
  // Normalized detail payloads from backend
  trivia?: TriviaPuzzleDetail;
  open_ended?: OpenEndedPuzzleDetail;
  picture_compare?: PictureComparePuzzleDetail;
  ar?: ArPuzzleDetail;
  compass?: CompassPuzzleDetail;
  // Backward-compatible fallbacks
  options?: string[];
  correct_answer?: string;
  reference_image?: string;
};

export type PuzzleBaseUpsertPayload = {
  question: string;
  hint?: string;
};

export type TriviaPuzzleUpsertPayload = PuzzleBaseUpsertPayload & {
  options: string[];
  correct_answer: string;
};

export type OpenEndedPuzzleUpsertPayload = PuzzleBaseUpsertPayload & {
  correct_answer: string;
};

export type PictureComparePuzzleUpsertPayload = PuzzleBaseUpsertPayload & {
  referenceImageUri: string;
  similarity_threshold?: number;
};

export type ArPuzzleUpsertPayload = PuzzleBaseUpsertPayload & {
  scene_asset_url?: string;
  metadata?: Record<string, any>;
};

export type CompassPuzzleUpsertPayload = PuzzleBaseUpsertPayload & {
  target_heading_degrees: number;
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
  cover_image?: string;
  cover_image_attribution?: string;
  creator: User;
  tour_type: TourType;
  category: string;
  difficulty: Difficulty;
  duration_minutes: number;
  total_distance?: number;
  walking_distance?: number;
  elevation_gain?: number;
  max_leg_distance?: number;
  requires_transport?: boolean;
  is_circular?: boolean;
  accessibility_rating?: number;
  metrics_calculated?: boolean;
  is_premium: boolean;
  is_ai_generated: boolean;
  user_has_completed_once?: boolean;
  city: string;
  country?: string;
  country_code?: string;
  city_latitude?: number;
  city_longitude?: number;
  status: TourStatus;
  generation_source: TourGenerationSource;
  created_at: string;
  updated_at: string;
  steps: TourStep[];
  reviews: Review[];
  average_rating?: number;
};

export function getTourImageUri(tour: Pick<Tour, 'id' | 'cover_image' | 'creator'>): string {
  return tour.cover_image || '';
}

export type ToursResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tour[];
};

export type MyToursFilters = {
  status?: TourStatus;
  generation_source?: TourGenerationSource;
  is_ai_generated?: boolean;
};

export type TourFilters = {
  search?: string;
  category?: string;
  continent?: string;
  city?: string;
  country?: string;
  country_code?: string;
  difficulty?: Difficulty;
  tour_type?: TourType;
  is_premium?: boolean;
  status?: TourStatus;
  creator?: number;
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

function isRemoteHttpUrl(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function isUploadableAssetUri(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!value.trim()) return false;
  if (isRemoteHttpUrl(value) || value.startsWith('data:')) return false;

  // RN/Expo may return different local schemes by platform/source.
  return (
    value.startsWith('file://') ||
    value.startsWith('content://') ||
    value.startsWith('ph://') ||
    value.startsWith('assets-library://') ||
    value.startsWith('/')
  );
}

function getUniqueCoverImageName(uri: string): string {
  const cleanUri = uri.split('?')[0].split('#')[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  const ext = (match?.[1] || 'jpg').toLowerCase();
  return `cover_image_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function appendTourField(formData: FormData, key: string, value: unknown) {
  if (value === undefined) return;
  if (value === null) {
    formData.append(key, '');
    return;
  }
  if (typeof value === 'boolean') {
    formData.append(key, value ? 'true' : 'false');
    return;
  }
  formData.append(key, String(value));
}

function toTourPayload(tourData: Partial<Tour>): Partial<Tour> | FormData {
  const { cover_image, ...rest } = tourData;
  if (!isUploadableAssetUri(cover_image)) {
    if (isRemoteHttpUrl(cover_image)) {
      return rest;
    }
    return tourData;
  }

  const formData = new FormData();
  Object.entries(rest).forEach(([key, value]) => appendTourField(formData, key, value));
  formData.append('cover_image', {
    uri: cover_image,
    name: getUniqueCoverImageName(cover_image),
    type: 'image/jpeg',
  } as any);
  return formData;
}

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
    if (filters.category) params.category = filters.category;
    if (filters.continent) params.continent = filters.continent;
    if (filters.city) params.city = filters.city;
    if (filters.country) params.country = filters.country;
    if (filters.country_code) params.country_code = filters.country_code;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.tour_type) params.tour_type = filters.tour_type;
    if (filters.is_premium !== undefined) params.is_premium = filters.is_premium;
    if (filters.status) params.status = filters.status;
    if (filters.creator) params.creator = filters.creator;
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
  const url = `/api/tours/${tourId}/`;

  try {
    return await apiRequest<Tour>({
      method: 'GET',
      url,
      auth: true, // Prefer authenticated request for user-specific reveal fields.
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return apiRequest<Tour>({
        method: 'GET',
        url,
        auth: false, // Fallback for stale/invalid tokens on a publicly readable endpoint.
        signal,
      });
    }
    throw error;
  }
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
  return getTours({ ...filters, category }, signal);
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
  const data = toTourPayload(tourData);
  return apiRequest<Tour, typeof data>({
    method: 'POST',
    url: '/api/tours/',
    data,
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
  const data = toTourPayload(tourData);
  return apiRequest<Tour, typeof data>({
    method: 'PATCH',
    url: `/api/tours/${tourId}/`,
    data,
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
 * Fetch reviews for a specific tour (requires authentication)
 */
export async function getTourReviews(tourId: number, signal?: AbortSignal): Promise<Review[]> {
  return apiRequest<Review[]>({
    method: 'GET',
    url: `/api/tours/${tourId}/reviews/`,
    auth: true,
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
 * @param filtersOrStatus - Optional filters, or a legacy status value
 */
export async function getMyTours(
  filtersOrStatus?: TourStatus | MyToursFilters,
  signal?: AbortSignal
): Promise<ToursResponse> {
  const params: Record<string, any> = {};
  const filters =
    typeof filtersOrStatus === 'string' ? { status: filtersOrStatus } : filtersOrStatus;

  if (filters?.status) params.status = filters.status;
  if (filters?.generation_source) params.generation_source = filters.generation_source;
  if (filters?.is_ai_generated !== undefined) params.is_ai_generated = filters.is_ai_generated;

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
 * Fetch published tours whose first step falls inside the map bounding box
 */
export async function getToursInBounds(
  north: number,
  south: number,
  east: number,
  west: number,
  signal?: AbortSignal
): Promise<Tour[]> {
  return apiRequest<Tour[]>({
    method: 'GET',
    url: '/api/tours/in-bounds/',
    params: { north, south, east, west },
    auth: false,
    signal,
  });
}

function prepareTourStepPayload(stepData: Partial<TourStep>): Partial<TourStep> | FormData {
  const isNewFileUpload =
    typeof stepData.image === 'string' && stepData.image.startsWith('file://');

  if (isNewFileUpload) {
    const formData = new FormData();
    Object.keys(stepData).forEach((key) => {
      const k = key as keyof TourStep;
      const value = stepData[k];
      if (value === undefined || value === null) return;
      if (k === 'image') {
        formData.append('image', {
          uri: value as string,
          name: 'step_image.jpg',
          type: 'image/jpeg',
        } as any);
      } else {
        formData.append(k, String(value));
      }
    });
    return formData;
  }

  const { image, ...rest } = stepData;
  return rest;
}

/**
 * Add a step to a tour (requires authentication)
 */
export async function createTourStep(
  tourId: number,
  stepData: Partial<TourStep>,
  signal?: AbortSignal
): Promise<TourStep> {
  const data = prepareTourStepPayload(stepData);

  return apiRequest<TourStep, typeof data>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/`,
    data,
    auth: true,
    signal,
  });
}

/**
 * Update a step in a tour (requires authentication)
 */
export async function updateTourStep(
  tourId: number,
  stepId: number,
  stepData: Partial<TourStep>,
  signal?: AbortSignal
): Promise<TourStep> {
  const data = prepareTourStepPayload(stepData);

  return apiRequest<TourStep, typeof data>({
    method: 'PATCH',
    url: `/api/tours/${tourId}/steps/${stepId}/`,
    data,
    auth: true,
    signal,
  });
}

/**
 * Delete a step from a tour (requires authentication)
 */
export async function deleteTourStep(
  tourId: number,
  stepId: number,
  signal?: AbortSignal
): Promise<void> {
  return apiRequest<void>({
    method: 'DELETE',
    url: `/api/tours/${tourId}/steps/${stepId}/`,
    auth: true,
    signal,
  });
}

/**
 * Set or update the reference image for a picture-compare puzzle on a step.
 */
export async function setStepPictureReference(
  tourId: number,
  stepId: number,
  referenceImageUri: string,
  signal?: AbortSignal
): Promise<Puzzle> {
  const formData = new FormData();
  formData.append('reference_image', {
    uri: referenceImageUri,
    name: 'reference_image.jpg',
    type: 'image/jpeg',
  } as any);

  return apiRequest<Puzzle, FormData>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/${stepId}/set-picture-reference/`,
    data: formData,
    auth: true,
    signal,
  });
}

export async function setStepTriviaPuzzle(
  tourId: number,
  stepId: number,
  payload: TriviaPuzzleUpsertPayload,
  signal?: AbortSignal
): Promise<Puzzle> {
  return apiRequest<Puzzle, TriviaPuzzleUpsertPayload>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/${stepId}/set-trivia-puzzle/`,
    data: payload,
    auth: true,
    signal,
  });
}

export async function setStepPictureComparePuzzle(
  tourId: number,
  stepId: number,
  payload: PictureComparePuzzleUpsertPayload,
  signal?: AbortSignal
): Promise<Puzzle> {
  const formData = new FormData();
  formData.append('question', payload.question);
  formData.append('hint', payload.hint || '');
  if (payload.similarity_threshold !== undefined) {
    formData.append('similarity_threshold', String(payload.similarity_threshold));
  }
  formData.append('reference_image', {
    uri: payload.referenceImageUri,
    name: 'reference_image.jpg',
    type: 'image/jpeg',
  } as any);

  return apiRequest<Puzzle, FormData>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/${stepId}/set-picture-compare-puzzle/`,
    data: formData,
    auth: true,
    signal,
  });
}

export async function setStepOpenEndedPuzzle(
  tourId: number,
  stepId: number,
  payload: OpenEndedPuzzleUpsertPayload,
  signal?: AbortSignal
): Promise<Puzzle> {
  return apiRequest<Puzzle, OpenEndedPuzzleUpsertPayload>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/${stepId}/set-open-ended-puzzle/`,
    data: payload,
    auth: true,
    signal,
  });
}

export async function setStepArPuzzle(
  tourId: number,
  stepId: number,
  payload: ArPuzzleUpsertPayload,
  signal?: AbortSignal
): Promise<Puzzle> {
  return apiRequest<Puzzle, ArPuzzleUpsertPayload>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/${stepId}/set-ar-puzzle/`,
    data: payload,
    auth: true,
    signal,
  });
}

export async function getArModels(signal?: AbortSignal): Promise<ARModel[]> {
  return apiRequest<ARModel[]>({
    method: 'GET',
    url: '/api/tours/ar-models/',
    auth: true,
    signal,
  });
}

export async function setStepCompassPuzzle(
  tourId: number,
  stepId: number,
  payload: CompassPuzzleUpsertPayload,
  signal?: AbortSignal
): Promise<Puzzle> {
  return apiRequest<Puzzle, CompassPuzzleUpsertPayload>({
    method: 'POST',
    url: `/api/tours/${tourId}/steps/${stepId}/set-compass-puzzle/`,
    data: payload,
    auth: true,
    signal,
  });
}
