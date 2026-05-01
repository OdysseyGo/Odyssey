import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { profileStatsCompStyles } from './ProfileStatsComp.styles';
import { Props } from './ProfileStatsComp.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { useTranslation } from 'react-i18next';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const WalkthroughableView = walkthroughable(View);

type ProfileStat = {
  value?: number;
  label: string;
  onPress?: () => void;
  valueText?: string;
};

const OptionalCopilot = ({ disable, text, order, name, style, children }: any) => {
  if (disable) {
    return <View style={style}>{children}</View>;
  }
  return (
    <CopilotStep text={text} order={order} name={name}>
      <WalkthroughableView style={style}>{children}</WalkthroughableView>
    </CopilotStep>
  );
};

export default function ProfileStatsComp({
  km,
  tours,
  badges,
  followers,
  following,
  onToursPress,
  onBadgesPress,
  onFollowersPress,
  onFollowingPress,
  disableCopilot = false,
}: Props) {
  const theme = useColorTheme();
  const styles = profileStatsCompStyles(theme);
  const { t } = useTranslation();

  const achievementStats: ProfileStat[] = [
    {
      value: km,
      valueText: Number(km ?? 0).toFixed(1),
      label: t('profile.km'),
    },
    { value: tours, label: t('profile.tours'), onPress: onToursPress },
    { value: badges, label: t('profile.badges'), onPress: onBadgesPress },
  ];

  const socialStats: ProfileStat[] = [
    { value: followers, label: t('profile.followers'), onPress: onFollowersPress },
    { value: following, label: t('profile.following'), onPress: onFollowingPress },
  ];

  const renderStat = (stat: ProfileStat, index: number) => (
    <React.Fragment key={stat.label}>
      {index > 0 && <View style={styles.vDivider} />}
      {stat.onPress ? (
        <TouchableOpacity style={styles.statItem} onPress={stat.onPress} activeOpacity={0.7}>
          <Text style={styles.statValue}>{stat.valueText ?? stat.value ?? 0}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stat.valueText ?? stat.value ?? 0}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      )}
    </React.Fragment>
  );

  return (
    <OptionalCopilot
      text={t('tutorial.profile.step3text')}
      order={3}
      name="statsStep"
      style={styles.card}
      disable={disableCopilot}
    >
      {/* Achievement row */}
      <View style={styles.row}>{achievementStats.map((s, i) => renderStat(s, i))}</View>

      <View style={styles.hDivider} />

      {/* Social row */}
      <View style={styles.row}>{socialStats.map((s, i) => renderStat(s, i))}</View>
    </OptionalCopilot>
  );
}
