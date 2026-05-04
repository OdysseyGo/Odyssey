import { View, Image, Text } from 'react-native';
import { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailCoverProps } from './TourDetailCover.config';
import { tourDetailCoverStyles } from './TourDetailCover.styles';
import { STAR } from '@/constants/Symbols';
import { useTranslation } from 'react-i18next';
import TourImagePlaceholder from '@/components/common/TourImagePlaceholder';

export default function TourDetailCover({
  coverImage,
  coverImageAttribution,
  title,
  rating,
  reviewCount,
}: TourDetailCoverProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailCoverStyles(theme), [theme]);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.coverContainer}>
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <TourImagePlaceholder style={styles.coverImagePlaceholder} iconSize={42} />
      )}

      {/* Top gradient: dark → transparent (keeps white header icons readable) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.40)', 'transparent']}
        locations={[0, 1]}
        style={styles.topGradient}
      />

      {/* Bottom gradient: transparent → dark (title overlay) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.45, 1]}
        style={styles.gradient}
      />

      {/* Title + rating overlaid at the bottom */}
      <View style={styles.titleOverlay}>
        <Text style={styles.overlayTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.overlayStar}>{STAR}</Text>
          <Text style={styles.overlayRating}>{rating.toFixed(1)}</Text>
          <Text style={styles.overlayReviews}>
            ({reviewCount} {t('tourDetail.reviews')})
          </Text>
        </View>
        {coverImageAttribution ? (
          <Text style={styles.overlayAttribution} numberOfLines={1}>
            {t('tourDetail.photoCredit', { attribution: coverImageAttribution })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
