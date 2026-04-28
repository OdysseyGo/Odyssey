import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { profileBadgesContainerStyles } from './ProfileBadgesContainer.styles';
import { ProfileBadgesContainerProps } from './ProfileBadgesContainer.config';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { normalizeCountryCode } from '@/lib/flags';
import HexBadge from './HexBadge';

export default function ProfileBadgesContainer({
  badges = [],
  title = 'Badges',
  onViewAll,
}: ProfileBadgesContainerProps) {
  const theme = useColorTheme();
  const styles = profileBadgesContainerStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  if (!badges || badges.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.accentBar} />
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        <Text style={styles.emptyStateText}>{t('profile.noBadges')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{badges.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {badges.map((badge) => (
          <View
            key={badge.id}
            style={[styles.badgeCard, badge.unlocked && styles.badgeCardUnlocked]}
          >
            <HexBadge
              code={badge.code}
              city={badge.city}
              countryCode={badge.countryCode}
              fallbackLabel={badge.name}
              visualConfig={badge.visualConfig as any}
            />
            <Text style={styles.badgeName} numberOfLines={2}>
              {badge.name}
            </Text>
            {badge.city ? (
              <Text style={styles.badgeMetaText} numberOfLines={1}>
                {badge.city} · {normalizeCountryCode(badge.countryCode)}
              </Text>
            ) : null}
          </View>
        ))}

        {badges.length > 3 && onViewAll && (
          <TouchableOpacity style={styles.viewAllCard} activeOpacity={0.7} onPress={onViewAll}>
            <Ionicons name="grid-outline" size={22} color={color.primary} />
            <Text style={styles.viewAllText}>{t('profile.viewAllBadges')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
