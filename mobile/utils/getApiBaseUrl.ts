import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl() {
  try {
    // Needed when testing on external devices.
    const envBaseUrl = process.env.EXPO_API_BASE_URL;
    if (envBaseUrl) {
      return envBaseUrl;
    }

    return 'https://api.odysseygo.quest';
  } catch (e) {
    console.error('Error in getApiBaseUrl:', e);
    return 'https://api.odysseygo.quest';
  }
}
