import Constants from 'expo-constants';

type ExpoExtra = {
  envMode?: string;
};

export function getEnvMode(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  return String(extra.envMode ?? 'production')
    .trim()
    .toLowerCase();
}

export function isDevelopmentEnvMode(): boolean {
  return getEnvMode() === 'development';
}
