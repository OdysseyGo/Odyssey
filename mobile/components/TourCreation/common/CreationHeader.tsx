import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { creationHeaderStyles } from './CreationHeader.styles';
import BackButton from '@/components/common/BackButton';

type CreationHeaderProps = {
  title: string;
  onBack: () => void;
};

export default function CreationHeader({ title, onBack }: CreationHeaderProps) {
  const theme = useColorTheme();
  const styles = creationHeaderStyles(theme);

  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} style={styles.headerButton} />
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButton} />
    </View>
  );
}
