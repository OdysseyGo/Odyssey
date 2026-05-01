import { apiRequest } from './APIClient';

export type TourProgressStatus = 'IN_PROGRESS' | 'COMPLETED';

export type TourProgress = {
  id: number;
  tour: number;
  user: number;
  current_step: number | null;
  status: TourProgressStatus;
  started_at: string;
  completed_at: string | null;
  total_xp: number;
  skip_count: number;
  wrong_attempt_count: number;
  step_attempt_counts: Record<string, number>;
};

export type CreateTourProgressRequest = {
  tour_id: number;
};

export type StepActionResponse = {
  status: string;
  is_tour_complete: boolean;
  new_step_id: number | null;
  awarded_xp: number;
};

export type PictureCompareResponse = StepActionResponse & {
  accepted: boolean;
  similarity_score: number;
  threshold_used: number;
  processing_ms: number;
};

export type ArCodeResponse = StepActionResponse & {
  accepted: boolean;
};

export type TriviaAnswerResponse = StepActionResponse & {
  accepted: boolean;
  attempt_count?: number;
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
 * Submit a captured image for backend-verified picture-compare puzzle checking.
 */
export async function submitPictureCompare(
  id: number,
  imageUri: string,
  signal?: AbortSignal
): Promise<PictureCompareResponse> {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'picture_compare_attempt.jpg',
    type: 'image/jpeg',
  } as any);

  return apiRequest<PictureCompareResponse, FormData>({
    method: 'POST',
    url: `/api/tour-progress/${id}/submit-picture-compare/`,
    data: formData,
    auth: true,
    signal,
  });
}

/**
 * Submit a code guess for an AR puzzle on the current step.
 */
export async function submitArCode(
  id: number,
  code: string,
  signal?: AbortSignal
): Promise<ArCodeResponse> {
  return apiRequest<ArCodeResponse, { code: string }>({
    method: 'POST',
    url: `/api/tour-progress/${id}/submit-ar-code/`,
    data: { code },
    auth: true,
    signal,
  });
}

/**
 * Submit a selected answer for a TRIVIA puzzle on the current step.
 */
export async function submitTriviaAnswer(
  id: number,
  answer: string,
  signal?: AbortSignal
): Promise<TriviaAnswerResponse> {
  return apiRequest<TriviaAnswerResponse, { answer: string }>({
    method: 'POST',
    url: `/api/tour-progress/${id}/submit-trivia-answer/`,
    data: { answer },
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
