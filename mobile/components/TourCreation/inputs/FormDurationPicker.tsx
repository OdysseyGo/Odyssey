import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { formDurationPickerStyles } from './FormDurationPicker.styles';

type FormDurationPickerProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

export default function FormDurationPicker({
  value,
  onChange,
  min = 15,
  max = 480,
  step = 15,
  unit = 'minutes',
}: FormDurationPickerProps) {
  const theme = useColorTheme();
  const styles = formDurationPickerStyles(theme);
  const color = Colors[theme];

  const handleDecrease = () => {
    onChange(Math.max(min, value - step));
  };

  const handleIncrease = () => {
    onChange(Math.min(max, value + step));
  };

  return (
    <View style={styles.durationContainer}>
      <TouchableOpacity style={styles.durationButton} onPress={handleDecrease}>
        <Ionicons name="remove" size={24} color={color.text} />
      </TouchableOpacity>
      <View>
        <Text style={styles.durationValue}>{value}</Text>
        <Text style={styles.durationUnit}>{unit}</Text>
      </View>
      <TouchableOpacity style={styles.durationButton} onPress={handleIncrease}>
        <Ionicons name="add" size={24} color={color.text} />
      </TouchableOpacity>
    </View>
  );
}
