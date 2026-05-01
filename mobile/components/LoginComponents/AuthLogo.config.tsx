import { ScaledSize } from 'react-native';

export type AuthLogoVariant = 'regular' | 'compact';

type AuthLogoVariantConfig = {
  sizeRatio: number;
  minSize: number;
  maxSize: number;
  imageScale: number;
  borderRadiusRatio: number;
};

export const authLogoConfig: Record<AuthLogoVariant, AuthLogoVariantConfig> = {
  regular: {
    sizeRatio: 0.23,
    minSize: 86,
    maxSize: 112,
    imageScale: 0.86,
    borderRadiusRatio: 0.22,
  },
  compact: {
    sizeRatio: 0.21,
    minSize: 74,
    maxSize: 96,
    imageScale: 0.86,
    borderRadiusRatio: 0.22,
  },
};

export const mobileIcon = require('../../assets/images/mobile_icon.png');

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function getAuthLogoMetrics(
  dimensions: Pick<ScaledSize, 'width' | 'height'>,
  variant: AuthLogoVariant
) {
  const config = authLogoConfig[variant];
  const shortSide = Math.min(dimensions.width, dimensions.height);
  const containerSize = clamp(shortSide * config.sizeRatio, config.minSize, config.maxSize);
  const imageSize = containerSize * config.imageScale;

  return {
    containerSize,
    imageSize,
    borderRadius: imageSize * config.borderRadiusRatio,
  };
}
