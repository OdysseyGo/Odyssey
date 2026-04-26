import { Linking } from 'react-native';

export type ExternalMapsProvider = 'apple' | 'google' | 'yandex';
export type ExternalMapsMode = 'driving' | 'walking' | 'transit';

interface OpenExternalMapsDirectionsParams {
  provider: ExternalMapsProvider;
  destinationLat: number;
  destinationLng: number;
  originLat?: number;
  originLng?: number;
  mode?: ExternalMapsMode;
}

function getAppleMode(mode: ExternalMapsMode): string {
  switch (mode) {
    case 'walking':
      return 'w';
    case 'transit':
      return 'r';
    default:
      return 'd';
  }
}

function getGoogleMode(mode: ExternalMapsMode): string {
  switch (mode) {
    case 'walking':
      return 'walking';
    case 'transit':
      return 'transit';
    default:
      return 'driving';
  }
}

function getYandexMode(mode: ExternalMapsMode): string {
  switch (mode) {
    case 'walking':
      return 'pd';
    case 'transit':
      return 'mt';
    default:
      return 'auto';
  }
}

function buildMapsUrl({
  provider,
  destinationLat,
  destinationLng,
  originLat,
  originLng,
  mode = 'walking',
}: OpenExternalMapsDirectionsParams): string {
  const destination = `${destinationLat},${destinationLng}`;
  const hasOrigin = typeof originLat === 'number' && typeof originLng === 'number';
  const origin = hasOrigin ? `${originLat},${originLng}` : undefined;

  switch (provider) {
    case 'apple': {
      const params = new URLSearchParams({
        daddr: destination,
        dirflg: getAppleMode(mode),
      });

      if (origin) {
        params.set('saddr', origin);
      }

      return `http://maps.apple.com/?${params.toString()}`;
    }
    case 'google': {
      const params = new URLSearchParams({
        api: '1',
        destination,
        travelmode: getGoogleMode(mode),
      });

      if (origin) {
        params.set('origin', origin);
      }

      return `https://www.google.com/maps/dir/?${params.toString()}`;
    }
    case 'yandex': {
      if (origin) {
        const params = new URLSearchParams({
          rtext: `${origin}~${destination}`,
          rtt: getYandexMode(mode),
        });

        return `https://yandex.ru/maps/?${params.toString()}`;
      }

      const params = new URLSearchParams({
        pt: `${destinationLng},${destinationLat}`,
        z: '17',
        l: 'map',
      });

      return `https://yandex.ru/maps/?${params.toString()}`;
    }
  }
}

export async function openExternalMapsDirections(
  params: OpenExternalMapsDirectionsParams
): Promise<void> {
  const url = buildMapsUrl(params);
  await Linking.openURL(url);
}
