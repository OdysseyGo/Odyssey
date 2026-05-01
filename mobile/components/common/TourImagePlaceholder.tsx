import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';

type TourImagePlaceholderProps = {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  label?: string;
};

export default function TourImagePlaceholder({
  style,
  iconSize = 28,
  label = 'No image',
}: TourImagePlaceholderProps) {
  const theme = useColorTheme();
  const color = Colors[theme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color.foregroundSecondary,
          borderColor: color.borderLight,
        },
        style,
      ]}
    >
      <Ionicons name="image-outline" size={iconSize} color={color.subText} />
      <Text style={[styles.label, { color: color.subText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
