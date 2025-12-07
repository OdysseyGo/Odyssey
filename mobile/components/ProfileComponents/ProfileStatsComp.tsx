import React from 'react';
import { View, Text } from 'react-native';
import { profileStatsCompStyles } from './ProfileStatsComp.styles';
import { Props } from './ProfileStatsComp.config';
import { useColorTheme } from '@/utils/useColorTheme';

export default function ProfileStatsComp({ xp, tours, badges, followers, following }: Props) {
  const theme = useColorTheme();
  const styles = profileStatsCompStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{tours}</Text>
          <Text style={styles.statLabel}>Tours</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{badges}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>
      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.bottomItem}>
          <Text style={styles.bottomValue}>{followers}</Text>
          <Text style={styles.bottomLabel}>Followers</Text>
        </View>

        <View style={styles.bottomDivider} />

        <View style={styles.bottomItem}>
          <Text style={styles.bottomValue}>{following}</Text>
          <Text style={styles.bottomLabel}>Following</Text>
        </View>
      </View>
    </View>
  );
}
