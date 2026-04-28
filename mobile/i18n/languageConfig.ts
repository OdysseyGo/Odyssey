import * as Localization from 'expo-localization';

export const FALLBACK_LANGUAGE = 'en';
export const SYSTEM_LANGUAGE_PREFERENCE = 'system';

export const SUPPORTED_LANGUAGE_OPTIONS = [
  { code: SYSTEM_LANGUAGE_PREFERENCE, labelKey: 'settings.languages.system' },
  { code: 'en', labelKey: 'settings.languages.en' },
  { code: 'tr', labelKey: 'settings.languages.tr' },
  { code: 'es', labelKey: 'settings.languages.es' },
] as const;

export const MANUAL_LANGUAGE_OPTIONS = SUPPORTED_LANGUAGE_OPTIONS.filter(
  ({ code }) => code !== SYSTEM_LANGUAGE_PREFERENCE
);

export type LanguagePreferenceCode = (typeof SUPPORTED_LANGUAGE_OPTIONS)[number]['code'];
export type SupportedLanguageCode = (typeof MANUAL_LANGUAGE_OPTIONS)[number]['code'];

export const SUPPORTED_LANGUAGE_CODES = MANUAL_LANGUAGE_OPTIONS.map(({ code }) => code);

export function normalizeLanguageCode(languageCode?: string | null) {
  return languageCode?.split('-')[0]?.toLowerCase();
}

export function isSupportedLanguageCode(
  languageCode?: string | null
): languageCode is SupportedLanguageCode {
  const normalizedLanguageCode = normalizeLanguageCode(languageCode);
  return SUPPORTED_LANGUAGE_CODES.includes(normalizedLanguageCode as SupportedLanguageCode);
}

export function resolveSupportedLanguage(languageCode?: string | null): SupportedLanguageCode {
  const normalizedLanguageCode = normalizeLanguageCode(languageCode);
  return isSupportedLanguageCode(normalizedLanguageCode)
    ? normalizedLanguageCode
    : FALLBACK_LANGUAGE;
}

export function getDeviceLanguage(): SupportedLanguageCode {
  const locale = Localization.getLocales()[0];
  return resolveSupportedLanguage(locale?.languageTag ?? locale?.languageCode);
}

export function resolveAppLanguage(savedLanguage?: string | null): SupportedLanguageCode {
  const normalizedSavedLanguage = normalizeLanguageCode(savedLanguage);
  return isSupportedLanguageCode(normalizedSavedLanguage)
    ? normalizedSavedLanguage
    : getDeviceLanguage();
}

export function resolveLanguagePreference(savedLanguage?: string | null): LanguagePreferenceCode {
  const normalizedSavedLanguage = normalizeLanguageCode(savedLanguage);
  return normalizedSavedLanguage === SYSTEM_LANGUAGE_PREFERENCE ||
    isSupportedLanguageCode(normalizedSavedLanguage)
    ? normalizedSavedLanguage
    : SYSTEM_LANGUAGE_PREFERENCE;
}
