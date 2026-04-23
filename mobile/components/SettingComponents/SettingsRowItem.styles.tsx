// components/settings/SettingsItemRow.styles.ts
import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

export const rowItemStyle = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: color.foreground,
    },

    rowPressed: {
      backgroundColor: color.press,
    },

    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.border,
    },

    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: color.foregroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },

    icon: {
      color: color.tabIconDefault,
    },

    textContainer: {
      flex: 1,
    },

    label: {
      fontSize: 15,
      color: color.text,
    },

    description: {
      marginTop: 2,
      fontSize: 12,
      color: color.subText,
    },

    chevron: {
      color: color.text,
    },

    rightContent: {
      marginRight: Spacing.sm,
    },

    profileImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
  });
};
