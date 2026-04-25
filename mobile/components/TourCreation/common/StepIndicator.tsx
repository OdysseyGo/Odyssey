import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { stepIndicatorStyles } from './StepIndicator.styles';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

type StepIndicatorProps = {
  steps: string[];
  currentStepIndex: number;
};

export default function StepIndicator({ steps, currentStepIndex }: StepIndicatorProps) {
  const theme = useColorTheme();
  const styles = stepIndicatorStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();
  const progress = `${currentStepIndex + 1}/${steps.length}`;
  const currentStep = steps[currentStepIndex];

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {t('creation.stepProgress', { progress, defaultValue: `Step ${progress}` })}
        </Text>
        <Text style={styles.progressTitle}>
          {t(`creation.steps.${currentStep}`, { defaultValue: currentStep })}
        </Text>
      </View>
      <View style={styles.track}>
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          return (
            <View key={step} style={styles.stepWrap}>
              <View
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isCompleted && styles.dotCompleted,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={color.white} />
                ) : (
                  <Text style={[styles.dotText, isActive && styles.dotTextActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.connector, isCompleted && styles.connectorCompleted]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
