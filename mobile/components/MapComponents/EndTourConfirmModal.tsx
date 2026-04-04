import React, { useMemo } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import getStyles from './EndTourConfirmModal.styles';
import { EndTourConfirmModalProps } from './EndTourConfirmModal.config';

export default function EndTourConfirmModal({
  visible,
  earnedXP,
  completedSteps,
  totalSteps,
  onConfirm,
  onCancel,
}: EndTourConfirmModalProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  const remainingSteps = totalSteps - completedSteps;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="exit-run" size={40} color={colors.error} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('map.endTour.title')}</Text>
          <Text style={styles.message}>{t('map.endTour.message')}</Text>

          {/* Progress Info */}
          <View style={styles.progressInfo}>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{completedSteps}</Text>
              <Text style={styles.progressLabel}>{t('map.endTour.completed')}</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{remainingSteps}</Text>
              <Text style={styles.progressLabel}>{t('map.endTour.remaining')}</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressValue, { color: colors.star }]}>{earnedXP}</Text>
              <Text style={styles.progressLabel}>{t('map.endTour.xpEarned')}</Text>
            </View>
          </View>

          {/* Warning */}
          {remainingSteps > 0 && (
            <View style={styles.warningContainer}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={colors.star} />
              <Text style={styles.warningText}>
                {t('map.endTour.stepsRemaining', { count: remainingSteps })}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{t('map.endTour.continueTour')}</Text>
            </Pressable>

            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <MaterialCommunityIcons name="exit-run" size={18} color={colors.white} />
              <Text style={styles.confirmButtonText}>{t('map.endTour.exitTour')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
