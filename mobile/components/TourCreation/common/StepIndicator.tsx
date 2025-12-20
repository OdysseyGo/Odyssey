import React from 'react';
import { View } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { stepIndicatorStyles } from './StepIndicator.styles';

type StepIndicatorProps = {
  steps: string[];
  currentStepIndex: number;
};

export default function StepIndicator({ steps, currentStepIndex }: StepIndicatorProps) {
  const theme = useColorTheme();
  const styles = stepIndicatorStyles(theme);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View
          key={step}
          style={[
            styles.dot,
            index === currentStepIndex && styles.dotActive,
            index < currentStepIndex && styles.dotCompleted,
          ]}
        />
      ))}
    </View>
  );
}
