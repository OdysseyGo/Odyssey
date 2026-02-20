import React from 'react';
import { TouchableOpacity ,View, Text } from 'react-native';
import { profileStatsCompStyles } from './ProfileStatsComp.styles';
import { Props } from './ProfileStatsComp.config';
import { useColorTheme } from '@/utils/useColorTheme';

export default function ProfileStatsComp({ xp, tours, badges, followers, following, onToursPress,onBadgesPress,onFollowersPress,onFollowingPress }: Props) {
  const theme = useColorTheme();
  const styles = profileStatsCompStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>

        <TouchableOpacity style={styles.statItem} onPress={onToursPress} activeOpacity={0.7}>
          <Text style={styles.statValue}>{tours}</Text>
          <Text style={styles.statLabel}>Tours</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statItem} onPress={onBadgesPress} activeOpacity={0.7}>
          <Text style={styles.statValue}>{badges}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.bottomItem} onPress={onFollowersPress} activeOpacity={0.7}>
          <Text style={styles.bottomValue}>{followers}</Text>
          <Text style={styles.bottomLabel}>Followers</Text>
        </TouchableOpacity>

        <View style={styles.bottomDivider} />

        <TouchableOpacity style={styles.bottomItem} onPress={onFollowingPress} activeOpacity={0.7}>
          <Text style={styles.bottomValue}>{following}</Text>
          <Text style={styles.bottomLabel}>Following</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
