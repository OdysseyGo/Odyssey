import { apiRequest } from './APIClient';

export async function fetchGoogleMapsApiKey(): Promise<string> {
  const data = await apiRequest<{ key: string }>({ url: 'api/config/maps-key/' });
  return data.key;
}
