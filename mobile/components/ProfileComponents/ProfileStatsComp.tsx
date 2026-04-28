import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { profileStatsCompStyles } from './ProfileStatsComp.styles';
import { Props } from './ProfileStatsComp.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { useTranslation } from 'react-i18next';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughableView = walkthroughable(View);

export default function ProfileStatsComp({
  xp,
  tours,
  badges,
  followers,
  following,
  onToursPress,
  onBadgesPress,
  onFollowersPress,
  onFollowingPress,
}: Props) {
  const theme = useColorTheme();
  const styles = profileStatsCompStyles(theme);
  const { t } = useTranslation();

  const achievementStats = [
    { value: xp, label: t('profile.xp') },
    { value: tours, label: t('profile.tours'), onPress: onToursPress },
    { value: badges, label: t('profile.badges') },
  ];

  const socialStats = [
    { value: followers, label: t('profile.followers'), onPress: onFollowersPress },
    { value: following, label: t('profile.following'), onPress: onFollowingPress },
  ];

  const renderStat = (
    stat: { value?: number; label: string; onPress?: () => void },
    index: number
  ) => (
    <React.Fragment key={stat.label}>
      {index > 0 && <View style={styles.vDivider} />}
      {stat.onPress ? (
        <TouchableOpacity style={styles.statItem} onPress={stat.onPress} activeOpacity={0.7}>
          <Text style={styles.statValue}>{stat.value ?? 0}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stat.value ?? 0}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      )}
    </React.Fragment>
  );

  return (
    <CopilotStep text={t('tutorial.profile.step3text')} order={3} name="statsStep">
      <WalkthroughableView style={styles.card}>
        {/* Achievement row */}
        <View style={styles.row}>{achievementStats.map((s, i) => renderStat(s, i))}</View>

        <View style={styles.hDivider} />

        {/* Social row */}
        <View style={styles.row}>{socialStats.map((s, i) => renderStat(s, i))}</View>
      </WalkthroughableView>
    </CopilotStep>
  );
}
