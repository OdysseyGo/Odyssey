import { View, Image } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailCoverProps } from './TourDetailCover.config';
import { tourDetailCoverStyles } from './TourDetailCover.styles';
import BackButton from '@/components/common/BackButton';

export default function TourDetailCover({ coverImage }: TourDetailCoverProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailCoverStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.coverContainer}>
      <Image source={{ uri: coverImage }} style={styles.coverImage} />
      <BackButton color="#FFFFFF" style={[styles.backButton, { top: insets.top + 8 }]} />
    </View>
  );
}
