import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourTagsListStyles } from './TourTagsList.styles';

type TourTagsListProps = {
  tags: string[];
};

export default function TourTagsList({ tags }: TourTagsListProps) {
  const theme = useColorTheme();
  const styles = tourTagsListStyles(theme);

  return (
    <View style={styles.container}>
      {tags.map((tag, index) => (
        <View key={index} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}
