import { apiRequest } from './APIClient';

export type AITourGenerationRequest = {
  city: string;
  country?: string;
  country_code?: string;
  theme: string;
  mode: 'STORY' | 'PUZZLE' | 'HYBRID';
  duration: number;
  language: string;
  additional_details?: string;
  include_ar?: boolean;
  use_ad_slot?: boolean;
  include_compass?: boolean;
};

export type AITourJobAccepted = {
  job_id: string;
  status: GenerationJobStatus;
};

export type GenerationJobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type AITourJob = {
  job_id: string;
  status: GenerationJobStatus;
  progress_label: string;
  tour_id: number | null;
  error: string;
  created_at: string;
  updated_at: string;
};

export async function generateAITour(
  data: AITourGenerationRequest,
  signal?: AbortSignal
): Promise<AITourJobAccepted> {
  return apiRequest<AITourJobAccepted, AITourGenerationRequest>({
    method: 'POST',
    url: '/api/ai/generate-tour/',
    data,
    auth: true,
    signal,
  });
}

export async function getAITourJob(jobId: string, signal?: AbortSignal): Promise<AITourJob> {
  return apiRequest<AITourJob>({
    method: 'GET',
    url: `/api/ai/jobs/${jobId}/`,
    auth: true,
    signal,
  });
}
