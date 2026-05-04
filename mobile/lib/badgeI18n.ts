import type { TFunction } from 'i18next';

function slugifyLabel(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getLocalizedBadgeName(
  t: TFunction,
  code?: string | null,
  fallbackName?: string | null
): string {
  if (code) {
    const byCode = t(`badges.catalog.${code}.name`, { defaultValue: '' }).trim();
    if (byCode) return byCode;
  }

  const slug = slugifyLabel(fallbackName);
  if (slug) {
    const byName = t(`badges.names.${slug}`, { defaultValue: '' }).trim();
    if (byName) return byName;
  }

  return fallbackName?.trim() || code || '';
}

export function getLocalizedBadgeDescription(
  t: TFunction,
  code?: string | null,
  fallbackDescription?: string | null
): string {
  if (code) {
    const byCode = t(`badges.catalog.${code}.description`, { defaultValue: '' }).trim();
    if (byCode) return byCode;
  }

  return fallbackDescription?.trim() || '';
}
