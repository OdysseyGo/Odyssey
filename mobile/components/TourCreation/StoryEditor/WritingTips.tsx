import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { writingTipsStyles } from './WritingTips.styles';

const DEFAULT_TIPS = [
  'Set the scene: Describe what visitors will see and feel at this location.',
  'Include historical context or interesting facts.',
  'Add sensory details: sounds, smells, textures.',
  'Connect this stop to the overall tour narrative.',
  'Keep it engaging but concise (200-500 words ideal).',
];

type WritingTipsProps = {
  tips?: string[];
};

export default function WritingTips({ tips = DEFAULT_TIPS }: WritingTipsProps) {
  const theme = useColorTheme();
  const styles = writingTipsStyles(theme);

  return (
    <View style={styles.tipsContainer}>
      <Text style={styles.tipsTitle}>💡 Writing Tips</Text>
      {tips.map((tip, index) => (
        <View key={index} style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}
