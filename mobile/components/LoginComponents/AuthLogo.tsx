import React from 'react';
import { Image, useWindowDimensions, View } from 'react-native';
import { AuthLogoVariant, mobileIcon } from './AuthLogo.config';
import { authLogoStyles } from './AuthLogo.styles';

type AuthLogoProps = {
  variant?: AuthLogoVariant;
};

export default function AuthLogo({ variant = 'regular' }: AuthLogoProps) {
  const dimensions = useWindowDimensions();
  const styles = authLogoStyles(dimensions, variant);

  return (
    <View style={styles.container}>
      <Image source={mobileIcon} style={styles.image} resizeMode="contain" />
    </View>
  );
}
