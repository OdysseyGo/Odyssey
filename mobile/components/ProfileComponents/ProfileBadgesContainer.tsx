import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import { profileBadgesContainerStyles } from './ProfileBadgesContainer.styles';
import { ProfileBadgesContainerProps } from './ProfileBadgesContainer.config';
import Colors from '@/constants/Colors';
import ProfileBadges from './ProfileBadges';
import { useTranslation } from 'react-i18next';

export default function ProfileBadgesContainer({
  badges = [],
  title = 'Badges',
  showAll: initialShowAll = false,
  maxDisplay = 3,
}: ProfileBadgesContainerProps) {
  const theme = useColorTheme();
  const styles = profileBadgesContainerStyles(theme);
  const color = Colors[theme];
  const [showAll, setShowAll] = useState(initialShowAll);
  const { t } = useTranslation();

  if (!badges || badges.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyStateText}>{t('profile.noBadges')}</Text>
      </View>
    );
  }

  const displayedBadges = showAll ? badges : badges.slice(0, maxDisplay);
  const hasMoreBadges = badges.length > maxDisplay;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.badgeCount}>{badges.length}</Text>
      </View>

      <View style={styles.badgesGrid}>
        {displayedBadges.map((badge) => (
          <View key={badge.id} style={styles.badgeItem}>
            <ProfileBadges badges={[badge]} size="medium" />
          </View>
        ))}
      </View>

      {hasMoreBadges && !showAll && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => setShowAll(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.viewAllButtonText}>{t('profile.viewAllBadges')}</Text>
            <FontAwesome name="arrow-right" size={14} color="white" style={{ marginLeft: 8 }} />
          </View>
        </TouchableOpacity>
      )}

      {showAll && hasMoreBadges && (
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: color.secondary }]}
          onPress={() => setShowAll(false)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.viewAllButtonText, { color: color.text }]}>
              {t('profile.showLess')}
            </Text>
            <FontAwesome name="arrow-up" size={14} color={color.text} style={{ marginLeft: 8 }} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
