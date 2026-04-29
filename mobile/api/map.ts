import { apiRequest } from './APIClient';

export async function fetchGoogleMapsApiKey(): Promise<string> {
  const envKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (envKey) return envKey;

  const data = await apiRequest<{ key: string }>({
    url: '/api/config/maps-key/',
    auth: false,
  });
  return data.key;
}
