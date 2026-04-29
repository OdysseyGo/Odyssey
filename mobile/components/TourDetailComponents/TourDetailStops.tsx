import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailStopsProps } from './TourDetailStops.config';
import { tourDetailStopsStyles } from './TourDetailStops.styles';
import { useTranslation } from 'react-i18next';
import { isAfterFirstPuzzle } from '@/utils/tourStepVisibility';

export default function TourDetailStops({ stops, showAllStops = false }: TourDetailStopsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailStopsStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();
  const lockedStopIds = useMemo(
    () =>
      new Set(
        showAllStops
          ? []
          : stops
              .filter((stop, index) => isAfterFirstPuzzle(stops, index, (item) => item.hasPuzzle))
              .map((stop) => stop.id)
      ),
    [showAllStops, stops]
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('tourDetail.tourStops')}</Text>
        <View style={styles.stopCountBadge}>
          <Text style={styles.stopCount}>{stops.length}</Text>
        </View>
      </View>

      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        const isLocked = lockedStopIds.has(stop.id);

        return (
          <View key={stop.id} style={styles.stopItem}>
            {/* Timeline */}
            <View style={styles.timelineColumn}>
              <View
                style={[
                  styles.stopNumber,
                  isFirst && styles.stopNumberFirst,
                  isLocked && styles.stopNumberLocked,
                ]}
              >
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              {!isLast && (
                <View style={[styles.connectorLine, isLocked && styles.connectorLineLocked]} />
              )}
            </View>

            {/* Content card */}
            <View style={[styles.stopContent, isLast && styles.stopContentLast]}>
              <View style={[styles.stopCard, isLocked && styles.stopCardLocked]}>
                {!isLocked ? (
                  <>
                    <Text style={styles.stopTitle}>{stop.title}</Text>
                    <Text style={styles.stopDescription} numberOfLines={3}>
                      {stop.description}
                    </Text>
                  </>
                ) : null}
                {isLocked && (
                  <>
                    <BlurView intensity={36} tint={theme} style={styles.stopBlur} />
                    <View style={styles.lockedOverlay}>
                      <View style={styles.lockedIconWrap}>
                        <MaterialCommunityIcons
                          name="lock-outline"
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.lockedCopy}>
                        <Text style={styles.lockedTitle}>
                          {t('tourDetail.lockedStopTitle', {
                            defaultValue: 'Hidden stop',
                          })}
                        </Text>
                        <Text style={styles.lockedMessage} numberOfLines={2}>
                          {t('tourDetail.lockedStopMessage', {
                            defaultValue:
                              'Start the tour and solve the puzzle to reveal this stop.',
                          })}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
