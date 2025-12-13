import React, { ReactNode } from 'react';

import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthLayout;
