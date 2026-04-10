import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailBottomBarProps } from './TourDetailBottomBar.config';
import { tourDetailBottomBarStyles } from './TourDetailBottomBar.styles';
import { useTranslation } from 'react-i18next';

export default function TourDetailBottomBar({ onStartTour, starting }: TourDetailBottomBarProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailBottomBarStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

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
            <Ionicons name="compass" size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>{t('tourDetail.startTour')}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
