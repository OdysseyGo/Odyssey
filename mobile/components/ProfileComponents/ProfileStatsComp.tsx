import React from 'react';
import { View, Text } from 'react-native';
import { profileStatsCompStyles } from './ProfileStatsComp.styles';
import { Props } from './ProfileStatsComp.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { useTranslation } from 'react-i18next';

export default function ProfileStatsComp({ xp, tours, badges, followers, following }: Props) {
  const theme = useColorTheme();
  const styles = profileStatsCompStyles(theme);
  const { t } = useTranslation();

  const stats = [
    { value: xp, label: t('profile.xp') },
    { value: tours, label: t('profile.tours') },
    { value: badges, label: t('profile.badges') },
    { value: followers, label: t('profile.followers') },
    { value: following, label: t('profile.following') },
  ];

  return (
    <View style={styles.card}>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
