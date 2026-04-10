import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { addFriendsModalHeaderStyles } from './AddFriendsModalHeader.styles';
import { AddFriendsModalHeaderProps } from './AddFriendsModalHeader.config';
import { useTranslation } from 'react-i18next';

export default function AddFriendsModalHeader({}: AddFriendsModalHeaderProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalHeaderStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesome name="users" size={24} color={color.text} />
      </View>
      <Text style={styles.title}>{t('friends.discoverTitle')}</Text>
      <Text style={styles.subtitle}>{t('friends.discoverSubtitle')}</Text>
    </View>
  );
}
