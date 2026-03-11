import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { storyEditorHeaderStyles } from './StoryEditorHeader.styles';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

type StoryEditorHeaderProps = {
  onClose: () => void;
  onSave: () => void;
  isValid: boolean;
};

export default function StoryEditorHeader({ onClose, onSave, isValid }: StoryEditorHeaderProps) {
  const theme = useColorTheme();
  const styles = storyEditorHeaderStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onClose}>
        <Ionicons name="close" size={24} color={color.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('creation.story.editLocation')}</Text>
      <TouchableOpacity style={styles.headerButton} onPress={onSave} disabled={!isValid}>
        <Text style={[styles.saveButtonText, { color: isValid ? color.primary : color.subText }]}>
          {t('creation.story.save')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
