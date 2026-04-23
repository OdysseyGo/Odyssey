import { City, Country } from 'country-state-city';

export type CountrySuggestion = {
  name: string;
  country_code: string;
};

export type CitySuggestion = {
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
      country_code: country.isoCode,
    }));

  return countries;
}

export async function fetchCitySuggestions(
  query: string,
  countryCode?: string
): Promise<CitySuggestion[]> {
  if (!countryCode) return [];

  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const cities = City.getCitiesOfCountry(countryCode.toUpperCase()) || [];
  const seen = new Set<string>();
  const results: CitySuggestion[] = [];

  for (const city of cities) {
    const name = (city.name || '').trim();
    if (!name || !name.toLowerCase().includes(normalized)) continue;
    const lat = Number(city.latitude);
    const lng = Number(city.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const key = `${name.toLowerCase()}|${countryCode.toUpperCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      name,
      country_code: countryCode.toUpperCase(),
      latitude: lat,
      longitude: lng,
    });
    if (results.length >= 25) break;
  }

  return results;
}
