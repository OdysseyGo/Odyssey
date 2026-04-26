const DEFAULT_COUNTRY_CODE = 'ZZ';

export function normalizeCountryCode(code?: string | null): string {
  const normalized = (code || DEFAULT_COUNTRY_CODE).trim().toUpperCase();
  if (!normalized) {
    return DEFAULT_COUNTRY_CODE;
  }
  return normalized.slice(0, 2);
}
