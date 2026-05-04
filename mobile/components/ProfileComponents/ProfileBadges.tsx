import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { profileBadgesStyles } from './ProfileBadges.styles';
import { ProfileBadgesProps } from './ProfileBadges.config';
import { useTranslation } from 'react-i18next';
import { getLocalizedBadgeDescription, getLocalizedBadgeName } from '@/lib/badgeI18n';

export default function ProfileBadges({ badges = [], size = 'medium' }: ProfileBadgesProps) {
  const theme = useColorTheme();
  const styles = profileBadgesStyles(theme, size);
  const color = Colors[theme];
  const { t } = useTranslation();

  if (!badges || badges.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
        <Text style={{ color: color.subText }}>{t('badges.noBadges')}</Text>
      </View>
    );
  }

  return (
    <>
      {badges.map((badge) => (
        <View key={badge.id} style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
          <View
            style={[
              styles.badgeContainer,
              badge.unlocked ? styles.badgeContainerUnlocked : styles.badgeContainerLocked,
            ]}
          >
            <Text style={[styles.badge, badge.unlocked && styles.unlockedBadge]}>
              {badge.code || '🏅'}
            </Text>
            {!badge.unlocked && (
              <View style={styles.lockedOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
          </View>
          <Text style={styles.nameText}>{getLocalizedBadgeName(t, badge.code, badge.name)}</Text>
          {getLocalizedBadgeDescription(t, badge.code, badge.description) ? (
            <Text style={styles.descriptionText}>
              {getLocalizedBadgeDescription(t, badge.code, badge.description)}
            </Text>
          ) : null}
        </View>
      ))}
    </>
  );
}
