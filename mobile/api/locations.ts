import { City, Country, State } from 'country-state-city';
import { resolveSupportedLanguage } from '@/i18n/languageConfig';
import type { LocaleData } from 'i18n-iso-countries';
import stateTranslations from '@/constants/stateTranslations.generated.json';

const countries = require('i18n-iso-countries') as typeof import('i18n-iso-countries');

const LOCALE_DATA_BY_LANGUAGE: Record<string, LocaleData> = {
  en: require('i18n-iso-countries/langs/en.json'),
  tr: require('i18n-iso-countries/langs/tr.json'),
  es: require('i18n-iso-countries/langs/es.json'),
};

let hasRegisteredCountryLocales = false;
type StateTranslationEntry = { es?: string; tr?: string };
type StateTranslationMap = Record<string, Record<string, StateTranslationEntry>>;
const STATE_TRANSLATIONS = stateTranslations as StateTranslationMap;

export type CountrySuggestion = {
  name: string;
  country_code: string;
};

export type CitySuggestion = {
  name: string;
  country_code: string;
  country_name?: string;
  state_code?: string;
  state_name?: string;
  latitude: number;
  longitude: number;
};

function ensureCountryLocalesRegistered() {
  if (hasRegisteredCountryLocales) return;
  Object.values(LOCALE_DATA_BY_LANGUAGE).forEach((localeData) => {
    countries.registerLocale(localeData);
  });
  hasRegisteredCountryLocales = true;
}

function normalizeForSearch(value: string, language: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(language);
}

function getCountryDisplayName(isoCode: string, language: string): string {
  ensureCountryLocalesRegistered();

  const normalizedIsoCode = (isoCode || '').trim().toUpperCase();
  if (!normalizedIsoCode) return '';

  const resolvedLanguage = resolveSupportedLanguage(language);
  return countries.getName(normalizedIsoCode, resolvedLanguage) || '';
}

function getStateDisplayName(
  countryCode: string,
  stateCode: string,
  language: string,
  fallbackName: string
): string {
  const normalizedCountryCode = (countryCode || '').trim().toUpperCase();
  const normalizedStateCode = (stateCode || '').trim().toUpperCase();
  if (!normalizedCountryCode || !normalizedStateCode) return fallbackName;

  const resolvedLanguage = resolveSupportedLanguage(language);
  const localizedEntry = STATE_TRANSLATIONS[normalizedCountryCode]?.[normalizedStateCode];
  if (resolvedLanguage === 'es' && localizedEntry?.es) return localizedEntry.es;
  if (resolvedLanguage === 'tr' && localizedEntry?.tr) return localizedEntry.tr;
  return fallbackName;
}

function getBestCountryName(
  country: ReturnType<typeof Country.getAllCountries>[number],
  language: string
): string {
  return getCountryDisplayName(country.isoCode || '', language) || country.name;
}

function resolveCountryCodeByName(countryName?: string, language = 'en'): string {
  const normalizedCountryName = normalizeForSearch(countryName || '', language);
  if (!normalizedCountryName) return '';

  for (const country of Country.getAllCountries()) {
    const englishName = normalizeForSearch(country.name || '', language);
    const localizedName = normalizeForSearch(getBestCountryName(country, language), language);
    const isoCode = normalizeForSearch(country.isoCode || '', language);

    if (
      normalizedCountryName === englishName ||
      normalizedCountryName === localizedName ||
      normalizedCountryName === isoCode
    ) {
      return (country.isoCode || '').toUpperCase();
    }
  }

  return '';
}

export async function fetchCountrySuggestions(
  query: string,
  language = 'en'
): Promise<CountrySuggestion[]> {
  const resolvedLanguage = resolveSupportedLanguage(language);
  const normalized = normalizeForSearch(query, resolvedLanguage);
  if (!normalized) return [];

  const countries = Country.getAllCountries()
    .filter((country) => {
      const localizedName = normalizeForSearch(
        getCountryDisplayName(country.isoCode || '', resolvedLanguage),
        resolvedLanguage
      );
      const englishName = normalizeForSearch(country.name || '', resolvedLanguage);
      const code = normalizeForSearch(country.isoCode || '', resolvedLanguage);

      return (
        localizedName.includes(normalized) ||
        englishName.includes(normalized) ||
        code.includes(normalized)
      );
    })
    .slice(0, 25)
    .map((country) => ({
      name: getBestCountryName(country, resolvedLanguage),
      country_code: country.isoCode || '',
    }));

  return countries;
}

export async function fetchCitySuggestions(
  query: string,
  countryCode?: string,
  countryName?: string,
  language = 'en'
): Promise<CitySuggestion[]> {
  const resolvedLanguage = resolveSupportedLanguage(language);
  const normalized = normalizeForSearch(query, resolvedLanguage);
  if (!normalized) return [];

  const effectiveCountryCode =
    (countryCode || '').trim().toUpperCase() ||
    resolveCountryCodeByName(countryName, resolvedLanguage) ||
    '';

  const cities = effectiveCountryCode
    ? City.getCitiesOfCountry(effectiveCountryCode) || []
    : City.getAllCities();

  const seen = new Set<string>();
  const results: CitySuggestion[] = [];

  for (const city of cities) {
    const name = (city.name || '').trim();
    if (!name || !normalizeForSearch(name, resolvedLanguage).includes(normalized)) continue;
    const lat = Number(city.latitude);
    const lng = Number(city.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const cityCountryCode = (city.countryCode || effectiveCountryCode || '').toUpperCase();
    const cityStateCode = (city.stateCode || '').trim().toUpperCase();
    const state =
      cityStateCode && cityCountryCode
        ? State.getStateByCodeAndCountry(cityStateCode, cityCountryCode)
        : undefined;
    const stateFallbackName = (state?.name || '').trim();
    const cityStateName = getStateDisplayName(
      cityCountryCode,
      cityStateCode,
      resolvedLanguage,
      stateFallbackName
    );
    const cityCountryName = getCountryDisplayName(cityCountryCode, resolvedLanguage);
    const key = `${name.toLowerCase()}|${cityCountryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      name,
      country_code: cityCountryCode,
      country_name: cityCountryName || cityCountryCode,
      state_code: cityStateCode || undefined,
      state_name: cityStateName || undefined,
      latitude: lat,
      longitude: lng,
    });
    if (results.length >= 25) break;
  }

  return results;
}
