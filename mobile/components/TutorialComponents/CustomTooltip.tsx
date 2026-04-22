// components/TutorialComponents/CustomTooltip.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useCopilot } from 'react-native-copilot';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function CustomTooltip() {
  const { isFirstStep, isLastStep, goToNext, goToPrev, stop, currentStep } = useCopilot();
  const { t } = useTranslation();
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];

  return (
    
    <View style={[styles.container, { backgroundColor: theme.cardSurface }]}>
      
      {/* Dynamic Text Color */}
      <Text style={[styles.description, { color: theme.text }]}>
        {currentStep?.text}
      </Text>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={stop} activeOpacity={0.7} style={styles.actionButton}>
          {/* Dynamic SubText Color */}
          <Text style={[styles.skipText, { color: theme.subText }]}>
            {t('tutorial.skip', { defaultValue: 'Skip' })}
          </Text>
        </TouchableOpacity>

        <View style={styles.navContainer}>
          {!isFirstStep && (
            <TouchableOpacity onPress={goToPrev} activeOpacity={0.7} style={styles.actionButton}>
              {/* Dynamic Primary Color */}
              <Text style={[styles.prevText, { color: theme.primary }]}>
                {t('tutorial.previous', { defaultValue: 'Previous' })}
              </Text>
            </TouchableOpacity>
          )}

          {/* Dynamic Primary Background for the Next Button */}
          <TouchableOpacity 
            onPress={isLastStep ? stop : goToNext} 
            activeOpacity={0.8}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.primaryButtonText}>
              {isLastStep 
                ? t('tutorial.finish', { defaultValue: 'Finish' }) 
                : t('tutorial.next', { defaultValue: 'Next' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg, 
    borderRadius: 16,
    width: '100%',
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadiusFull,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  prevText: {
    fontSize: 14,
    fontWeight: '700',
  },
});