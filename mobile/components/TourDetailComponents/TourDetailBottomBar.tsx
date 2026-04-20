import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailBottomBarProps } from './TourDetailBottomBar.config';
import { tourDetailBottomBarStyles } from './TourDetailBottomBar.styles';
import { useTranslation } from 'react-i18next';

export default function TourDetailBottomBar({
  onStartTour,
  starting,
  creditPrice,
  hasAccess,
}: TourDetailBottomBarProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailBottomBarStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  const isPaid = !!creditPrice && creditPrice > 0 && !hasAccess;

  return (
    <View style={styles.bottomBar}>
      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          (pressed || starting) && styles.startButtonPressed,
        ]}
        onPress={onStartTour}
        disabled={starting}
      >
        {starting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Ionicons name={isPaid ? 'lock-closed' : 'compass'} size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>
              {isPaid ? `Unlock for ${creditPrice} credits` : t('tourDetail.startTour')}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
