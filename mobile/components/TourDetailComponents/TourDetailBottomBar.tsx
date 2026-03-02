import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailBottomBarProps } from './TourDetailBottomBar.config';
import { tourDetailBottomBarStyles } from './TourDetailBottomBar.styles';
import { useTranslation } from 'react-i18next';

export default function TourDetailBottomBar({ onStartTour }: TourDetailBottomBarProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailBottomBarStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.bottomBar}>
      <Pressable
        style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        onPress={onStartTour}
      >
        <Text style={styles.startButtonText}>{t('tourDetail.startTour')}</Text>
      </Pressable>
    </View>
  );
}
