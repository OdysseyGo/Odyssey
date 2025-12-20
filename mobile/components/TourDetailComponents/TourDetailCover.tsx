import { View, Text, Image } from 'react-native';
import { useMemo } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { useColorTheme } from '@/utils/useColorTheme';
import { STAR } from '@/constants/Symbols';
import { TourDetailCoverProps } from './TourDetailCover.config';
import { tourDetailCoverStyles } from './TourDetailCover.styles';

export default function TourDetailCover({
  coverImage,
  title,
  rating,
  reviewCount,
}: TourDetailCoverProps) {
  const theme = useColorTheme();
  const headerHeight = useHeaderHeight();
  const styles = useMemo(() => tourDetailCoverStyles(theme, headerHeight), [theme, headerHeight]);

  return (
    <View style={styles.coverContainer}>
      <Image source={{ uri: coverImage }} style={styles.coverImage} />
      <View style={styles.coverOverlay} />
      <View style={styles.coverContent}>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.star}>{STAR}</Text>
          <Text style={styles.ratingText}>
            {rating} ({reviewCount} reviews)
          </Text>
        </View>
      </View>
    </View>
  );
}
