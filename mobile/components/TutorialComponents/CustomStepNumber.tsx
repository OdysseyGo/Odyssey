import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useCopilot } from 'react-native-copilot';

export default function CustomStepNumber() {
  const colorScheme = useColorTheme();
  const theme = Colors[colorScheme];

  const { currentStepNumber, totalStepsNumber } = useCopilot();

  return (
    <View style={[styles.circle, { backgroundColor: theme.primary }]}>
      <Text style={styles.text}>{currentStepNumber}/{totalStepsNumber} </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF', 
    elevation: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});