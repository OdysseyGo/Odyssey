import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/Spacing';

export const puzzleEditorStyles = () => {
  return StyleSheet.create({
    container: {
      marginTop: 24,
      gap: 16,
    },
    section: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeButton: {
      flexBasis: '48%',
      flexGrow: 1,
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 17,
    },
    xpInput: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
  });
};
