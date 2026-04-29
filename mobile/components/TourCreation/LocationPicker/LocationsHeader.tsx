import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationsHeaderStyles } from './LocationsHeader.styles';
import { useTranslation } from 'react-i18next';

type LocationsHeaderProps = {
  count: number;
  title?: string;
};

export default function LocationsHeader({ count, title }: LocationsHeaderProps) {
  const theme = useColorTheme();
  const styles = locationsHeaderStyles(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.locationsHeader}>
      <Text style={styles.locationsTitle}>{title ?? t('creation.location.tourStops')}</Text>
      <Text style={styles.locationsCount}>{t('creation.location.locationsCount', { count })}</Text>
    </View>
  );
}
