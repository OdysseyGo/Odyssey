import { Country, State } from 'country-state-city';

export type CountrySuggestion = {
  name: string;
  country_code: string;
};

export type StateSuggestion = {
  name: string;
  country_code: string;
  latitude: number;
  longitude: number;
};

export async function fetchCountrySuggestions(query: string): Promise<CountrySuggestion[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const countries = Country.getAllCountries()
    .filter((country) => {
      const name = (country.name || '').toLowerCase();
      const code = (country.isoCode || '').toLowerCase();
      return name.includes(normalized) || code.includes(normalized);
    })
    .slice(0, 25)
    .map((country) => ({
      name: country.name,
      country_code: country.isoCode || '',
    }));

  return countries;
}

export async function fetchStateSuggestions(
  query: string,
  countryCode?: string,
  countryName?: string
): Promise<StateSuggestion[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const normalizedCountryName = (countryName || '').trim().toLowerCase();
  const effectiveCountryCode =
    (countryCode || '').trim().toUpperCase() ||
    Country.getAllCountries().find(
      (country) => (country.name || '').trim().toLowerCase() === normalizedCountryName
    )?.isoCode ||
    '';

  const states = effectiveCountryCode
    ? State.getStatesOfCountry(effectiveCountryCode) || []
    : Country.getAllCountries().flatMap((country) => State.getStatesOfCountry(country.isoCode) || []);

  const seen = new Set<string>();
  const results: StateSuggestion[] = [];

  for (const state of states) {
    const name = (state.name || '').trim();
    if (!name || !name.toLowerCase().includes(normalized)) continue;
    const lat = Number(state.latitude);
    const lng = Number(state.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const stateCountryCode = (state.countryCode || effectiveCountryCode || '').toUpperCase();
    const key = `${name.toLowerCase()}|${stateCountryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      name,
      country_code: stateCountryCode,
      latitude: lat,
      longitude: lng,
    });
    if (results.length >= 25) break;
  }

  return results;
}
