import React, { useMemo } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
          <Text style={styles.title}>Exit Tour?</Text>
          <Text style={styles.message}>
            Are you sure you want to exit? You will return to the map and this tour will not be
            marked as completed.
          </Text>

          {/* Progress Info */}
          <View style={styles.progressInfo}>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{completedSteps}</Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>{remainingSteps}</Text>
              <Text style={styles.progressLabel}>Remaining</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressValue, { color: colors.star }]}>{earnedXP}</Text>
              <Text style={styles.progressLabel}>XP Earned</Text>
            </View>
          </View>

          {/* Warning */}
          {remainingSteps > 0 && (
            <View style={styles.warningContainer}>
              <MaterialCommunityIcons name="alert-circle" size={18} color={colors.star} />
              <Text style={styles.warningText}>
                You still have {remainingSteps} step{remainingSteps > 1 ? 's' : ''} to explore!
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Continue Tour</Text>
            </Pressable>

            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <MaterialCommunityIcons name="exit-run" size={18} color={colors.white} />
              <Text style={styles.confirmButtonText}>Exit Tour</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
