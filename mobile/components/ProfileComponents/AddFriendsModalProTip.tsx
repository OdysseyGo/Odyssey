import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { addFriendsModalProTipStyles } from './AddFriendsModalProTip.styles';
import { AddFriendsModalProTipProps } from './AddFriendsModalProTip.config';

export default function AddFriendsModalProTip({}: AddFriendsModalProTipProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalProTipStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <FontAwesome name="lightbulb-o" size={16} color={color.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Pro Tip</Text>
          <Text style={styles.description}>
            Start typing to find friends by their username or full name
          </Text>
        </View>
      </View>
    </View>
  );
}
