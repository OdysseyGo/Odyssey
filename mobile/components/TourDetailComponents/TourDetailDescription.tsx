import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailDescriptionProps } from './TourDetailDescription.config';
import { tourDetailDescriptionStyles } from './TourDetailDescription.styles';

export default function TourDetailDescription({ description, tags }: TourDetailDescriptionProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailDescriptionStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About this tour</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
