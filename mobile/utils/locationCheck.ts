import type { CheckLocationResponse } from '@/api/tourProgress';
import { isDevelopmentEnvMode } from '@/utils/envMode';

export const LOCATION_CHECK_RADIUS_M = 100;

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusM = 6_371_000;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon2Rad = (lon2 * Math.PI) / 180;

  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
}

export function checkStepLocationLocal(params: {
  stepId: number;
  userLatitude: number;
  userLongitude: number;
  stepLatitude: number;
  stepLongitude: number;
}): CheckLocationResponse {
  if (isDevelopmentEnvMode()) {
    return {
      status: 'Location confirmed. You can continue.',
      accepted: true,
      step_id: params.stepId,
      distance_m: 0,
      radius_m: LOCATION_CHECK_RADIUS_M,
    };
  }

  const distanceM = haversineDistanceMeters(
    params.userLatitude,
    params.userLongitude,
    params.stepLatitude,
    params.stepLongitude
  );
  const accepted = distanceM <= LOCATION_CHECK_RADIUS_M;

  return {
    status: accepted
      ? 'Location confirmed. You can continue.'
      : 'You are outside the accepted area.',
    accepted,
    step_id: params.stepId,
    distance_m: Number(distanceM.toFixed(2)),
    radius_m: LOCATION_CHECK_RADIUS_M,
  };
}
