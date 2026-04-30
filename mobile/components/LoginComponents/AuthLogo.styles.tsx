import { ScaledSize, StyleSheet } from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { AuthLogoVariant, getAuthLogoMetrics } from './AuthLogo.config';

export const authLogoStyles = (
  dimensions: Pick<ScaledSize, 'width' | 'height'>,
  variant: AuthLogoVariant
) => {
  const metrics = getAuthLogoMetrics(dimensions, variant);

  return StyleSheet.create({
    container: {
      width: metrics.containerSize,
      height: metrics.containerSize,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: variant === 'compact' ? Spacing.xs : Spacing.sm,
    },
    image: {
      width: metrics.imageSize,
      height: metrics.imageSize,
      borderRadius: metrics.borderRadius,
    },
  });
};
