import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { ReportCategory } from '@/api/reports';
import { useColorTheme } from '@/utils/useColorTheme';

const REPORT_CATEGORIES: ReportCategory[] = [
  'INAPPROPRIATE',
  'HATE_OR_HARASSMENT',
  'SPAM',
  'MISLEADING',
  'SAFETY',
  'PRIVACY',
  'OTHER',
];

function getReportCategoryLabel(
  t: ReturnType<typeof useTranslation>['t'],
  category: ReportCategory
) {
  return t(`report.categories.${category}`, {
    defaultValue: category
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  });
}

type ReportContentModalProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  category: ReportCategory;
  reason: string;
  submitting: boolean;
  onChangeCategory: (value: ReportCategory) => void;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ReportContentModal({
  visible,
  title,
  subtitle,
  category,
  reason,
  submitting,
  onChangeCategory,
  onChangeReason,
  onClose,
  onSubmit,
}: ReportContentModalProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => reportContentModalStyles(), []);
  const colors = Colors[theme];
  const { t } = useTranslation();
  const trimmedReason = reason.trim();
  const detailsRequired = category === 'OTHER';
  const submitDisabled = submitting || (detailsRequired && trimmedReason.length < 3);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.cardSurface }]}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.error}14` }]}>
              <Ionicons name="flag-outline" size={22} color={colors.error} />
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t('report.close', { defaultValue: 'Close report form' })}
            >
              <Ionicons name="close" size={22} color={colors.subText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>{subtitle}</Text>

          <View style={styles.categoryGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              {t('report.categoryLabel', { defaultValue: 'Category' })}
            </Text>
            <View style={styles.categoryGrid}>
              {REPORT_CATEGORIES.map((item) => {
                const selected = item === category;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => onChangeCategory(item)}
                    disabled={submitting}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selected ? colors.primaryMuted : colors.foreground,
                        borderColor: selected ? colors.primary : colors.borderLight,
                        opacity: submitting ? 0.6 : 1,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: selected ? colors.primary : colors.text },
                      ]}
                    >
                      {getReportCategoryLabel(t, item)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            {detailsRequired
              ? t('report.detailsLabelRequired', {
                  defaultValue: 'Details required for Other',
                })
              : t('report.detailsLabelOptional', {
                  defaultValue: 'Details optional',
                })}
          </Text>
          <TextInput
            value={reason}
            onChangeText={onChangeReason}
            placeholder={
              detailsRequired
                ? t('report.reasonPlaceholder', {
                    defaultValue: 'Describe the problem...',
                  })
                : t('report.reasonPlaceholderOptional', {
                    defaultValue: 'Add any details that would help...',
                  })
            }
            placeholderTextColor={colors.placeholderTextColor}
            multiline
            textAlignVertical="top"
            editable={!submitting}
            maxLength={600}
            style={[
              styles.reasonInput,
              {
                color: colors.text,
                backgroundColor: colors.foreground,
                borderColor: colors.borderLight,
              },
            ]}
          />
          <Text style={[styles.reasonCount, { color: colors.subText }]}>{reason.length}/600</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              style={[
                styles.secondaryButton,
                { borderColor: colors.borderLight, opacity: submitting ? 0.55 : 1 },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                {t('report.cancel', { defaultValue: 'Cancel' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSubmit}
              disabled={submitDisabled}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.error,
                  opacity: submitDisabled ? 0.5 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                  {t('report.submit', { defaultValue: 'Submit report' })}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const reportContentModalStyles = () => {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    card: {
      borderRadius: 24,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
    },
    categoryGroup: {
      gap: Spacing.sm,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '800',
      marginBottom: -Spacing.xs,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    categoryChip: {
      minHeight: 38,
      maxWidth: '100%',
      borderRadius: 19,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      justifyContent: 'center',
    },
    categoryText: {
      fontSize: 13,
      fontWeight: '700',
    },
    reasonInput: {
      minHeight: 132,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: 15,
      lineHeight: 21,
    },
    reasonCount: {
      alignSelf: 'flex-end',
      fontSize: 12,
      marginTop: -Spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    secondaryButton: {
      flex: 1,
      height: 48,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: '700',
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: '800',
    },
  });
};
