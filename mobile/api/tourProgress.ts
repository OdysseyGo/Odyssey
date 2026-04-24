import { apiRequest } from './APIClient';
import { Tour } from './tours';

export type TourProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

export type TourProgress = {
  id: number;
  tour_id: number;
  user: number;
  current_step_id: number | null;
  tour_snapshot: Tour | null;
  status: TourProgressStatus;
  started_at: string;
  completed_at: string | null;
  total_xp: number;
  skip_count: number;
};

export type CreateTourProgressRequest = {
  tour_id: number;
};

export type StepActionResponse = {
  status: string;
  is_tour_complete: boolean;
  new_step_id: number | null;
};

export type DeleteTourProgressRequest = {
  id: number;
};

/**
 * Starts a new tour progress (triggers perform_create in Django)
 */
export async function createTourProgress(
  data: CreateTourProgressRequest,
  signal?: AbortSignal
): Promise<TourProgress> {
  return apiRequest<TourProgress, CreateTourProgressRequest>({
    method: 'POST',
    url: '/api/tour-progress/',
    data,
    auth: true,
    signal,
  });
}

/**
 * Gets a list of the user's tour progresses
 */
export async function getTourProgressList(signal?: AbortSignal): Promise<TourProgress[]> {
  return apiRequest<TourProgress[], void>({
    method: 'GET',
    url: '/api/tour-progress/',
    auth: true,
    signal,
  });
}

/**
 * Retrieves a specific tour progress by its ID
 */
export async function getTourProgress(id: number, signal?: AbortSignal): Promise<TourProgress> {
  return apiRequest<TourProgress, void>({
    method: 'GET',
    url: `/api/tour-progress/${id}/`,
    auth: true,
    signal,
  });
}

/**
 * Updates an existing tour progress
 */
export async function updateTourProgress(
  id: number,
  data: Partial<TourProgress>,
  signal?: AbortSignal
): Promise<TourProgress> {
  return apiRequest<TourProgress, Partial<TourProgress>>({
    method: 'PATCH',
    url: `/api/tour-progress/${id}/`,
    data,
    auth: true,
    signal,
  });
}

/**
 * Marks the current step as completed and moves to the next,
 * or finishes the tour if no steps remain.
 */
export async function completeStep(id: number, signal?: AbortSignal): Promise<StepActionResponse> {
  return apiRequest<StepActionResponse, void>({
    method: 'POST',
    url: `/api/tour-progress/${id}/complete-step/`,
    auth: true,
    signal,
  });
}

/**
 * Skips the current step without awarding XP and moves to the next,
 * or finishes the tour if no steps remain.
 */
export async function skipStep(id: number, signal?: AbortSignal): Promise<StepActionResponse> {
  return apiRequest<StepActionResponse, void>({
    method: 'POST',
    url: `/api/tour-progress/${id}/skip-step/`,
    auth: true,
    signal,
  });
}

/**
 * Returns users in progress tour (if there is one)
 */
export async function getInProgressTour(signal?: AbortSignal): Promise<TourProgress> {
  return apiRequest<TourProgress, void>({
    method: 'GET',
    url: '/api/tour-progress/in-progress/',
    auth: true,
    signal,
  });
}

export async function deleteTourProgress(request: DeleteTourProgressRequest, signal?: AbortSignal) {
  return apiRequest<void, void>({
    method: 'DELETE',
    url: `/api/tour-progress/${request.id}/`,
    auth: true,
    signal,
  });
}
