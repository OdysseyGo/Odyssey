import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const imageUploadSectionStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    imageSection: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    imagePlaceholder: {
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: color.border,
    },
    imagePlaceholderText: {
      fontSize: 14,
      color: color.subText,
      marginTop: Spacing.sm,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: Spacing.borderRadius,
    },
    removeImageButton: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: color.error,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
