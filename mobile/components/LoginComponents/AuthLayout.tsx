import React, { ReactNode } from 'react';

import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { authLayoutStyles } from './AuthLayout.styles';
import { useColorTheme } from '@/utils/useColorTheme';

type AuthLayoutProps = {
  children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const theme = useColorTheme();
  const styles = authLayoutStyles(theme);
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>{children}</View>
    </KeyboardAvoidingView>
  );
};

export default AuthLayout;
