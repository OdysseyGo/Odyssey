import AsyncStorage from '@react-native-async-storage/async-storage';

const DISCLAIMER_ACCEPTED_AT_KEY = 'disclaimer_accepted_at';
const DISCLAIMER_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function shouldShowDisclaimer() {
  try {
    const acceptedAt = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_AT_KEY);
    if (!acceptedAt) return true;

    const acceptedAtMs = Number(acceptedAt);
    if (!Number.isFinite(acceptedAtMs)) return true;

    return Date.now() - acceptedAtMs >= DISCLAIMER_REMINDER_INTERVAL_MS;
  } catch {
    return true;
  }
}

export async function rememberDisclaimerAccepted() {
  try {
    await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_AT_KEY, String(Date.now()));
  } catch {
    // The disclosure should not trap users if local storage is unavailable.
  }
}
