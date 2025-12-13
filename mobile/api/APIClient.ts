import axios, { AxiosRequestConfig, AxiosRequestHeaders, Method } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../utils/getApiBaseUrl';

type ApiRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
};

type ApiRequestOptions<TBody = Record<string, unknown>> = {
  method?: Method;
  url: string;
  params?: Record<string, unknown>;
  data?: TBody;
  headers?: AxiosRequestHeaders;
  auth?: boolean;
  signal?: AbortSignal;
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if ((config as ApiRequestConfig).skipAuth) return config;

  const token = await SecureStore.getItemAsync('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<TResponse = unknown, TBody = Record<string, unknown>>(
  options: ApiRequestOptions<TBody>
): Promise<TResponse> {
  const { method = 'get', url, params, data, headers, auth = true, signal } = options;

  const requestConfig: ApiRequestConfig = {
    method,
    url,
    params,
    data,
    headers,
    signal,
    skipAuth: !auth,
  };

  try {
    const response = await apiClient.request<TResponse>(requestConfig);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      if (statusCode === 401 && errorData?.code === 'token_not_valid') {
        await SecureStore.deleteItemAsync('userToken');
        throw new ApiError('Your session has expired. Please log in again.', statusCode, error);
      }
      
      const message =
        errorData?.detail ||
        errorData?.message ||
        errorData?.error ||
        `Server error (${statusCode})`;

      throw new ApiError(message, statusCode, error);
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      throw new ApiError(
        'Request timeout. Please check your connection and try again.',
        undefined,
        error
      );
    } else if (error.message === 'Network Error' || !navigator.onLine) {
      // Network error
      throw new ApiError('Network error. Please check your internet connection.', undefined, error);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Server unreachable
      throw new ApiError('Cannot reach the server. Please try again later.', undefined, error);
    } else if (error instanceof ApiError) {
      // Already an ApiError
      throw error;
    } else {
      // Unknown error
      throw new ApiError(
        error.message || 'An unexpected error occurred. Please try again.',
        undefined,
        error
      );
    }
  }
}

export default apiClient;
