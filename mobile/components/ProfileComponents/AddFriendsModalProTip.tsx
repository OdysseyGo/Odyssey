import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { addFriendsModalProTipStyles } from './AddFriendsModalProTip.styles';
import { AddFriendsModalProTipProps } from './AddFriendsModalProTip.config';
import { useTranslation } from 'react-i18next';

export default function AddFriendsModalProTip({}: AddFriendsModalProTipProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalProTipStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <FontAwesome name="lightbulb-o" size={16} color={color.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('friends.proTipTitle')}</Text>
          <Text style={styles.description}>{t('friends.proTipDescription')}</Text>
        </View>
      </View>
    </View>
  );
}
