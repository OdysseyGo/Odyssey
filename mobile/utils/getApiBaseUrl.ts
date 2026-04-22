import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl() {
  try {
    // Needed when testing on external devices.
    const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (envBaseUrl) {
      return envBaseUrl;
    }

    const hostUri = Constants.expoConfig?.hostUri;

    if (hostUri) {
      const host = hostUri.split(':')[0];
      console.log(host);
      
      return `http://${host}:8000`;
    }
    return 'http://localhost:8000';

    return 'https://api.odysseygo.quest';
  } catch (e) {
    console.error('Error in getApiBaseUrl:', e);
    return 'https://api.odysseygo.quest';
  }
}
