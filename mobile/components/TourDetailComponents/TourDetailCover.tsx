import { View, Image, Text } from 'react-native';
import { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailCoverProps } from './TourDetailCover.config';
import { tourDetailCoverStyles } from './TourDetailCover.styles';
import BackButton from '@/components/common/BackButton';
import { STAR } from '@/constants/Symbols';
import { useTranslation } from 'react-i18next';

export default function TourDetailCover({
  coverImage,
  title,
  rating,
  reviewCount,
}: TourDetailCoverProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailCoverStyles(theme), [theme]);
  const color = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={styles.coverContainer}>
      <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />

      {/* True gradient: transparent at top → solid black at bottom */}
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
      </View>

      <BackButton color={color.white} style={[styles.backButton, { top: insets.top + 8 }]} />
    </View>
  );
}
