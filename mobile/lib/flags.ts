const DEFAULT_COUNTRY_CODE = 'ZZ';

export function normalizeCountryCode(code?: string | null): string {
  const normalized = (code || DEFAULT_COUNTRY_CODE).trim().toUpperCase();
  if (!normalized) {
    return DEFAULT_COUNTRY_CODE;
  }
  return normalized.slice(0, 2);
}

export function countryCodeToFlagEmoji(code?: string | null): string | null {
  const normalized = normalizeCountryCode(code);
  if (!/^[A-Z]{2}$/.test(normalized) || normalized === DEFAULT_COUNTRY_CODE) {
    return null;
  }

  const codePoints = [...normalized].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
