import React from 'react';
import { View, Text, TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { storyEditorFooterStyles } from './StoryEditorFooter.styles';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

type StoryEditorFooterProps = {
  onSave: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  isValid: boolean;
};

export default function StoryEditorFooter({
  onSave,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  isValid,
}: StoryEditorFooterProps) {
  const theme = useColorTheme();
  const styles = storyEditorFooterStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
        onPress={() => {
          Keyboard.dismiss();
          onSave();
        }}
        disabled={!isValid}
      >
        <Text style={styles.saveButtonText}>{t('creation.story.saveLocation')}</Text>
      </TouchableOpacity>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, !hasPrev && styles.navButtonDisabled]}
          onPress={() => {
            Keyboard.dismiss();
            onNavigatePrev?.();
          }}
          disabled={!hasPrev}
        >
          <Ionicons name="chevron-back" size={20} color={color.text} />
          <Text style={styles.navButtonText}>{t('creation.story.previous')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
          onPress={() => {
            Keyboard.dismiss();
            onNavigateNext?.();
          }}
          disabled={!hasNext}
        >
          <Text style={styles.navButtonText}>{t('creation.story.next')}</Text>
          <Ionicons name="chevron-forward" size={20} color={color.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
