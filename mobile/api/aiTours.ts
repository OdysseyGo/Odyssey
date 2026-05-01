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
};

export type AITourGenerationResponse = {
  tour_id: number;
  title: string;
  message: string;
};

export async function generateAITour(
  data: AITourGenerationRequest,
  signal?: AbortSignal
): Promise<AITourGenerationResponse> {
  return apiRequest<AITourGenerationResponse, AITourGenerationRequest>({
    method: 'POST',
    url: '/api/ai/generate-tour/',
    data,
    auth: true,
    signal,
  });
}
