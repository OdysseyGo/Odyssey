import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { emptyLocationsStyles } from './EmptyLocations.styles';
import { useTranslation } from 'react-i18next';

type EmptyLocationsProps = {
  message?: string;
};

export default function EmptyLocations({ message }: EmptyLocationsProps) {
  const theme = useColorTheme();
  const styles = emptyLocationsStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.emptyLocations}>
      <Ionicons name="location-outline" size={48} color={color.subText} />
      <Text style={styles.emptyLocationsText}>{message ?? t('creation.location.empty')}</Text>
    </View>
  );
}
