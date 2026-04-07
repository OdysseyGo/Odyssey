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

  const achievementStats = [
    { value: xp, label: t('profile.xp') },
    { value: tours, label: t('profile.tours') },
    { value: badges, label: t('profile.badges') },
  ];

  const socialStats = [
    { value: followers, label: t('profile.followers') },
    { value: following, label: t('profile.following') },
  ];

  const renderStat = (stat: { value?: number; label: string }, index: number, total: number) => (
    <React.Fragment key={stat.label}>
      {index > 0 && <View style={styles.vDivider} />}
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stat.value ?? 0}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </View>
    </React.Fragment>
  );

  return (
    <View style={styles.card}>
      {/* Achievement row: XP · Tours · Badges */}
      <View style={styles.row}>
        {achievementStats.map((s, i) => renderStat(s, i, achievementStats.length))}
      </View>

      <View style={styles.hDivider} />

      {/* Social row: Followers · Following */}
      <View style={styles.row}>
        {socialStats.map((s, i) => renderStat(s, i, socialStats.length))}
      </View>
    </View>
  );
}
