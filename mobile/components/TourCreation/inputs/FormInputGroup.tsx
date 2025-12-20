import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { formInputGroupStyles } from './FormInputGroup.styles';

type FormInputGroupProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

export default function FormInputGroup({ label, required = false, children }: FormInputGroupProps) {
  const theme = useColorTheme();
  const styles = formInputGroupStyles(theme);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {required && ' *'}
      </Text>
      {children}
    </View>
  );
}
