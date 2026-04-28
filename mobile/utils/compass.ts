type Vector3 = {
  x: number;
  y: number;
  z: number;
};

const EPSILON = 1e-6;

export const normalizeHeading = (angle: number) => ((angle % 360) + 360) % 360;

export const circularDeltaDegrees = (current: number, target: number) =>
  Math.abs(((current - target + 540) % 360) - 180);

export const shortestAngleDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

export const smoothHeading = (
  previous: number,
  next: number,
  alpha: number,
  deadbandDegrees = 0
) => {
  const delta = shortestAngleDelta(previous, next);
  if (Math.abs(delta) <= deadbandDegrees) {
    return normalizeHeading(previous);
  }
  return normalizeHeading(previous + delta * alpha);
};

const normalizeVector = (vector: Vector3): Vector3 | null => {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  if (magnitude < EPSILON) {
    return null;
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude,
  };
};

/**
 * Returns compass heading in degrees where:
 * 0 = North, 90 = East, 180 = South, 270 = West.
 * Uses tilt compensation when gravity vector is available.
 */
export const headingFromSensors = (
  magneticField: Vector3,
  gravity: Vector3 | null,
  headingOffsetDegrees = 0
) => {
  const magneticNorm = normalizeVector(magneticField);
  if (!magneticNorm) {
    return normalizeHeading(headingOffsetDegrees);
  }

  if (gravity) {
    const gravityNorm = normalizeVector(gravity);
    if (gravityNorm) {
      // Project magnetic vector onto the horizontal plane.
      const dot =
        magneticNorm.x * gravityNorm.x +
        magneticNorm.y * gravityNorm.y +
        magneticNorm.z * gravityNorm.z;
      const horizontal = {
        x: magneticNorm.x - dot * gravityNorm.x,
        y: magneticNorm.y - dot * gravityNorm.y,
        z: magneticNorm.z - dot * gravityNorm.z,
      };
      const horizontalNorm = normalizeVector(horizontal);
      if (horizontalNorm) {
        const angle = (Math.atan2(horizontalNorm.x, horizontalNorm.y) * 180) / Math.PI;
        return normalizeHeading(angle + headingOffsetDegrees);
      }
    }
  }

  const fallbackAngle = (Math.atan2(magneticField.x, magneticField.y) * 180) / Math.PI;
  return normalizeHeading(fallbackAngle + headingOffsetDegrees);
};
