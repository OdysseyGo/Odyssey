import { View, Text, Image } from 'react-native';
import { useMemo } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { useColorTheme } from '@/utils/useColorTheme';
import { STAR } from '@/constants/Symbols';
import { TourDetailCoverProps } from './TourDetailCover.config';
import { tourDetailCoverStyles } from './TourDetailCover.styles';
import { useTranslation } from 'react-i18next';

export default function TourDetailCover({
  coverImage,
  title,
  rating,
  reviewCount,
}: TourDetailCoverProps) {
  const theme = useColorTheme();
  const headerHeight = useHeaderHeight();
  const styles = useMemo(() => tourDetailCoverStyles(theme, headerHeight), [theme, headerHeight]);
  const { t } = useTranslation();

  return (
    <View style={styles.coverContainer}>
      <Image source={{ uri: coverImage }} style={styles.coverImage} />
      <View style={styles.coverOverlay} />
      <View style={styles.coverContent}>
        <Text style={styles.coverTitle}>{title}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.star}>{STAR}</Text>
          <Text style={styles.ratingText}>
            {rating} ({reviewCount} {t('tourDetail.reviews')})
          </Text>
        </View>
      </View>
    </View>
  );
}
