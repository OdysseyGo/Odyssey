import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationsHeaderStyles } from './LocationsHeader.styles';

type LocationsHeaderProps = {
  count: number;
  title?: string;
};

export default function LocationsHeader({ count, title = 'Tour Stops' }: LocationsHeaderProps) {
  const theme = useColorTheme();
  const styles = locationsHeaderStyles(theme);

  return (
    <View style={styles.locationsHeader}>
      <Text style={styles.locationsTitle}>{title}</Text>
      <Text style={styles.locationsCount}>{count} locations</Text>
    </View>
  );
}
