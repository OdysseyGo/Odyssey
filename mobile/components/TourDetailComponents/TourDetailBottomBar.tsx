import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailBottomBarProps } from './TourDetailBottomBar.config';
import { tourDetailBottomBarStyles } from './TourDetailBottomBar.styles';

export default function TourDetailBottomBar({
  onStartTour,
  creditPrice,
  hasAccess,
}: TourDetailBottomBarProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailBottomBarStyles(theme), [theme]);

  const isPaid = !!creditPrice && creditPrice > 0 && !hasAccess;

  return (
    <View style={styles.bottomBar}>
      <Pressable
        style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
        onPress={onStartTour}
      >
        <Text style={styles.startButtonText}>
          {isPaid ? `Unlock for ${creditPrice} credits` : 'Start Tour'}
        </Text>
      </Pressable>
    </View>
  );
}
