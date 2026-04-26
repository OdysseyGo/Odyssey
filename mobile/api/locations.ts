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
      country_code: country.isoCode || '',
    }));

  return countries;
}

export async function fetchCitySuggestions(
  query: string,
  countryCode?: string,
  countryName?: string
): Promise<CitySuggestion[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const normalizedCountryName = (countryName || '').trim().toLowerCase();
  const effectiveCountryCode =
    (countryCode || '').trim().toUpperCase() ||
    Country.getAllCountries().find(
      (country) => (country.name || '').trim().toLowerCase() === normalizedCountryName
    )?.isoCode ||
    '';

  const cities = effectiveCountryCode
    ? City.getCitiesOfCountry(effectiveCountryCode) || []
    : City.getAllCities();

  const seen = new Set<string>();
  const results: CitySuggestion[] = [];

  for (const city of cities) {
    const name = (city.name || '').trim();
    if (!name || !name.toLowerCase().includes(normalized)) continue;
    const lat = Number(city.latitude);
    const lng = Number(city.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const cityCountryCode = (city.countryCode || effectiveCountryCode || '').toUpperCase();
    const key = `${name.toLowerCase()}|${cityCountryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      name,
      country_code: cityCountryCode,
      latitude: lat,
      longitude: lng,
    });
    if (results.length >= 25) break;
  }

  return results;
}
