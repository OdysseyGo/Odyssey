import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorTheme } from '@/utils/useColorTheme';
import { creationHeaderStyles } from './CreationHeader.styles';
import BackButton from '@/components/common/BackButton';

type CreationHeaderProps = {
  title: string;
  onBack?: () => void;
};

export default function CreationHeader({ title, onBack }: CreationHeaderProps) {
  const theme = useColorTheme();
  const styles = creationHeaderStyles(theme);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <BackButton onPress={onBack} style={styles.headerButton} />
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButton} />
    </View>
  );
}
