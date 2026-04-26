import { Platform, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';

import { ODYSSEY_TAB_BAR_HEIGHT, ODYSSEY_TAB_BAR_INNER_PADDING } from './OdysseyTabBar.config';

export const odysseyTabBarStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    outerWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 40,
    },
    shell: {
      width: '100%',
      backgroundColor: colors.cardSurface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderLight,
      ...Platform.select({
        ios: {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.07,
          shadowRadius: 8,
        },
        android: { elevation: 10 },
      }),
    },
    innerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: ODYSSEY_TAB_BAR_HEIGHT,
      paddingHorizontal: ODYSSEY_TAB_BAR_INNER_PADDING,
      position: 'relative',
    },
    activeIndicatorWrap: {
      position: 'absolute',
      top: ODYSSEY_TAB_BAR_INNER_PADDING,
      bottom: ODYSSEY_TAB_BAR_INNER_PADDING,
      left: ODYSSEY_TAB_BAR_INNER_PADDING,
      borderRadius: 10,
      overflow: 'hidden',
    },
    activeIndicator: {
      flex: 1,
      borderRadius: 10,
      backgroundColor: colors.primary,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
      }),
    },
    tabButton: {
      height: ODYSSEY_TAB_BAR_HEIGHT - ODYSSEY_TAB_BAR_INNER_PADDING * 2,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      zIndex: 1,
    },
    iconOrbit: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.2,
      opacity: 0.9,
    },
    tabLabelFocused: {
      fontWeight: '800',
      opacity: 1,
    },
  });
