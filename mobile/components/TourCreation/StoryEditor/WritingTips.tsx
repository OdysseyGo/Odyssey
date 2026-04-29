import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { writingTipsStyles } from './WritingTips.styles';
import { useTranslation } from 'react-i18next';

type WritingTipsProps = {
  tips?: string[];
};

export default function WritingTips({ tips }: WritingTipsProps) {
  const theme = useColorTheme();
  const styles = writingTipsStyles(theme);
  const { t } = useTranslation();

  const displayTips = tips ?? [
    t('creation.story.writingTip1'),
    t('creation.story.writingTip2'),
    t('creation.story.writingTip3'),
    t('creation.story.writingTip4'),
    t('creation.story.writingTip5'),
  ];

  return (
    <View style={styles.tipsContainer}>
      <Text style={styles.tipsTitle}>{t('creation.story.writingTipsTitle')}</Text>
      {displayTips.map((tip, index) => (
        <View key={index} style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}
