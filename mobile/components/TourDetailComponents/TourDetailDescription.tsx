import { View, Text, TouchableOpacity } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailDescriptionProps } from './TourDetailDescription.config';
import { tourDetailDescriptionStyles } from './TourDetailDescription.styles';
import { useTranslation } from 'react-i18next';

const MAX_LINES = 3;

export default function TourDetailDescription({ description, tags }: TourDetailDescriptionProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailDescriptionStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  const handleTextLayout = useCallback((e: { nativeEvent: { lines: { text: string }[] } }) => {
    if (e.nativeEvent.lines.length > MAX_LINES) {
      setNeedsTruncation(true);
    }
  }, []);

  const tagIcons: Record<string, string> = {
    walking: 'walk-outline',
    cultural: 'earth-outline',
    historical: 'library-outline',
    food: 'restaurant-outline',
    nature: 'leaf-outline',
    adventure: 'compass-outline',
  };

  const getTagIcon = (tag: string): string => {
    const lower = tag.toLowerCase();
    for (const [key, icon] of Object.entries(tagIcons)) {
      if (lower.includes(key)) return icon;
    }
    return 'pricetag-outline';
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('tourDetail.aboutThisTour')}</Text>
      <Text
        style={styles.description}
        numberOfLines={expanded ? undefined : MAX_LINES}
        onTextLayout={handleTextLayout}
      >
        {description}
      </Text>
      {needsTruncation && (
        <TouchableOpacity style={styles.readMoreButton} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.readMoreText}>
            {expanded
              ? t('tourDetail.readLess', { defaultValue: 'Read less' })
              : t('tourDetail.readMore', { defaultValue: 'Read more' })}
          </Text>
        </TouchableOpacity>
      )}
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Ionicons name={getTagIcon(tag) as any} size={14} color={colors.primary} />
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
