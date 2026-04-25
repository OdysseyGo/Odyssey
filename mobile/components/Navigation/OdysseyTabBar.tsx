import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useColorTheme } from '@/utils/useColorTheme';

const BAR_INNER_PADDING = 4;
const BAR_HEIGHT = 62;
const ACTIVE_CONTENT_COLOR = '#020617';
export const ODYSSEY_TAB_BAR_FLOATING_HEIGHT = BAR_HEIGHT;

export default function OdysseyTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const themeName = useColorTheme();
  const colors = Colors[themeName];
  const activeContentColor = themeName === 'light' ? colors.white : ACTIVE_CONTENT_COLOR;
  const insets = useSafeAreaInsets();
  const safeAreaBottom = Math.max(insets.bottom, Spacing.sm);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const barWidth = width;

  const visibleRoutes = useMemo(
    () =>
      state.routes.filter((route) => {
        const options = descriptors[route.key]?.options as { href?: string | null } | undefined;
        return route.name !== 'index' && options?.href !== null;
      }),
    [descriptors, state.routes]
  );

  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === state.routes[state.index]?.key)
  );

  const tabWidth = useMemo(() => {
    if (visibleRoutes.length === 0) return 0;
    return (barWidth - BAR_INNER_PADDING * 2) / visibleRoutes.length;
  }, [barWidth, visibleRoutes.length]);

  // Keep fresh refs so pan responder callbacks never read stale values
  const activeIndexRef = useRef(activeVisibleIndex);
  activeIndexRef.current = activeVisibleIndex;
  const tabWidthRef = useRef(tabWidth);
  tabWidthRef.current = tabWidth;
  const visibleRoutesRef = useRef(visibleRoutes);
  visibleRoutesRef.current = visibleRoutes;

  // ─── Tab indicator: spring to active tab ─────────────
  const indicatorTranslateX = useRef(new Animated.Value(activeVisibleIndex * tabWidth)).current;

  useEffect(() => {
    Animated.spring(indicatorTranslateX, {
      toValue: activeVisibleIndex * tabWidth,
      useNativeDriver: true,
      damping: 28,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [activeVisibleIndex, indicatorTranslateX, tabWidth]);

  // ─── Drag offset: follows finger while swiping ────────
  const dragX = useRef(new Animated.Value(0)).current;
  const currentDragX = useRef(0); // raw value tracked separately to avoid stale reads
  const indicatorX = useMemo(() => Animated.add(indicatorTranslateX, dragX), [indicatorTranslateX, dragX]);

  const tabPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => {
        dragX.setValue(0);
        currentDragX.current = 0;
      },
      onPanResponderMove: (_, g) => {
        const tw = tabWidthRef.current;
        const idx = activeIndexRef.current;
        const count = visibleRoutesRef.current.length;
        const clamped = Math.min((count - 1 - idx) * tw, Math.max(-idx * tw, g.dx));
        dragX.setValue(clamped);
        currentDragX.current = clamped;
      },
      onPanResponderRelease: (_, g) => {
        const tw = tabWidthRef.current;
        const idx = activeIndexRef.current;
        const routes = visibleRoutesRef.current;

        // Target tab purely from final position — no velocity override
        const rawTarget = (idx * tw + currentDragX.current) / tw;
        const targetIndex = Math.min(routes.length - 1, Math.max(0, Math.round(rawTarget)));

        // Collapse dragX + indicatorTranslateX into a single value instantly,
        // then run one spring to the target — no two animations fighting each other
        const absoluteX = idx * tw + currentDragX.current;
        dragX.setValue(0);
        currentDragX.current = 0;
        indicatorTranslateX.setValue(absoluteX);

        Animated.spring(indicatorTranslateX, {
          toValue: targetIndex * tw,
          useNativeDriver: true,
          damping: 28,
          stiffness: 180,
          mass: 0.8,
        }).start();

        if (targetIndex !== idx) {
          navigation.navigate(routes[targetIndex].name, routes[targetIndex].params);
        }
      },
    })
  ).current;

  return (
    <View style={styles.outerWrap}>
      <View style={styles.shell}>
        <View style={styles.innerBar} {...tabPanResponder.panHandlers}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicatorWrap,
              {
                width: Math.max(tabWidth - 2, 0),
                transform: [{ translateX: indicatorX }],
              },
            ]}
          >
            <View style={styles.activeIndicator} />
          </Animated.View>

          {visibleRoutes.map((route) => {
            const routeIndex = state.routes.findIndex((item) => item.key === route.key);
            const descriptor = descriptors[route.key];
            const options = descriptor.options;
            const isFocused = state.index === routeIndex;
            const iconColor = isFocused ? activeContentColor : colors.subText;
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                style={({ pressed }) => [
                  styles.tabButton,
                  {
                    width: tabWidth,
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
                onPress={onPress}
                onLongPress={onLongPress}
              >
                <View style={styles.tabContent}>
                  <View style={styles.iconOrbit}>
                    {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 20 })}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabLabel,
                      { color: iconColor },
                      isFocused && styles.tabLabelFocused,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Safe area fill */}
        <View style={{ height: safeAreaBottom }} />
      </View>
    </View>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
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
      height: BAR_HEIGHT,
      paddingHorizontal: BAR_INNER_PADDING,
      position: 'relative',
    },
    activeIndicatorWrap: {
      position: 'absolute',
      top: BAR_INNER_PADDING,
      bottom: BAR_INNER_PADDING,
      left: BAR_INNER_PADDING,
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
      height: BAR_HEIGHT - BAR_INNER_PADDING * 2,
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
