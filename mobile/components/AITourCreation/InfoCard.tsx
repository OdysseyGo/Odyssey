import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { infoCardStyles } from './InfoCard.styles';

type InfoCardProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function InfoCard({ message, icon = 'information-circle-outline' }: InfoCardProps) {
  const theme = useColorTheme();
  const styles = infoCardStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={18} color={color.subText} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}
