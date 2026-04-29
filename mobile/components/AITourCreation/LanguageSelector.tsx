import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { languageSelectorStyles } from './LanguageSelector.styles';
import { LANGUAGE_OPTIONS } from './AITourCreation.types';
import { useTranslation } from 'react-i18next';

type LanguageSelectorProps = {
  selectedLanguage: string;
  onSelect: (languageCode: string) => void;
  title?: string;
  subtitle?: string;
};

export default function LanguageSelector({
  selectedLanguage,
  onSelect,
  title,
  subtitle,
}: LanguageSelectorProps) {
  const theme = useColorTheme();
  const styles = languageSelectorStyles(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title ?? t('aiTour.languageSelector.title')}</Text>
      <Text style={styles.subtitle}>{subtitle ?? t('aiTour.languageSelector.subtitle')}</Text>
      <View style={styles.chipContainer}>
        {LANGUAGE_OPTIONS.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.chip, selectedLanguage === lang.code && styles.chipSelected]}
            onPress={() => onSelect(lang.code)}
          >
            <Text
              style={[styles.chipText, selectedLanguage === lang.code && styles.chipTextSelected]}
            >
              {lang.flag} {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
