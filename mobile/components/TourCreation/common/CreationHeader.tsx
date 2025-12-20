import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { creationHeaderStyles } from './CreationHeader.styles';
import Colors from '@/constants/Colors';

type CreationHeaderProps = {
  title: string;
  onBack: () => void;
};

export default function CreationHeader({ title, onBack }: CreationHeaderProps) {
  const theme = useColorTheme();
  const styles = creationHeaderStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={color.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButton} />
    </View>
  );
}
