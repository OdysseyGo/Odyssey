import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { languageSelectorStyles } from './LanguageSelector.styles';
import { LANGUAGE_OPTIONS } from './AITourCreation.types';

type LanguageSelectorProps = {
  selectedLanguage: string;
  onSelect: (languageCode: string) => void;
  title?: string;
  subtitle?: string;
};

export default function LanguageSelector({
  selectedLanguage,
  onSelect,
  title = 'Content Language',
  subtitle = 'Select the language for tour content',
}: LanguageSelectorProps) {
  const theme = useColorTheme();
  const styles = languageSelectorStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
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
