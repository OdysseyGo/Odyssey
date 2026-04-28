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
  timeout: 300000, // 5 minutes
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

function getApiErrorMessage(errorData: unknown, statusCode: number): string {
  const extractMessage = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return undefined;

    if (Array.isArray(value)) {
      for (const item of value) {
        const message = extractMessage(item);
        if (message) return message;
      }
      return undefined;
    }

    const data = value as Record<string, unknown>;
    for (const key of ['detail', 'message', 'error', 'non_field_errors', 'city', 'steps']) {
      const message = extractMessage(data[key]);
      if (message) return message;
    }

    for (const nestedValue of Object.values(data)) {
      const message = extractMessage(nestedValue);
      if (message) return message;
    }

    return undefined;
  };

  return extractMessage(errorData) || `Server error (${statusCode})`;
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
    headers: { ...headers }, // Copy headers to avoid mutating original
    signal,
    skipAuth: !auth,
  };

  // Automatically set Content-Type for FormData
  if (data instanceof FormData) {
    requestConfig.headers = {
      ...requestConfig.headers,
      'Content-Type': 'multipart/form-data',
    };
  }

  try {
    const response = await apiClient.request<TResponse>(requestConfig);
    return response.data;
  } catch (error: any) {
    console.log('[apiRequest] failed', {
      url: `${apiClient.defaults.baseURL ?? ''}${url}`,
      method,
      code: error?.code,
      message: error?.message,
      hasResponse: Boolean(error?.response),
    });
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const errorData = error.response.data;

      // Clear token on any 401 Unauthorized error
      if (statusCode === 401) {
        await SecureStore.deleteItemAsync('userToken');
        throw new ApiError('Your session has expired. Please log in again.', statusCode, error);
      }

      const message = getApiErrorMessage(errorData, statusCode);

      throw new ApiError(message, statusCode, error);
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      throw new ApiError(
        'Request timeout. Please check your connection and try again.',
        undefined,
        error
      );
    } else if (error.message === 'Network Error') {
      // Network error
      throw new ApiError(
        `Network error reaching ${apiClient.defaults.baseURL ?? '(no baseURL)'}${url}`,
        undefined,
        error
      );
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
