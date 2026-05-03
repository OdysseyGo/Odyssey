import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { profileBadgesContainerStyles } from './ProfileBadgesContainer.styles';
import { ProfileBadgesContainerProps } from './ProfileBadgesContainer.config';
import { BadgeType } from './ProfileBadges.config';
import Colors from '@/constants/Colors';
import { BADGE_TIER_PALETTE, BadgeTier } from '@/constants/badgeTheme';
import { useTranslation } from 'react-i18next';
import { normalizeCountryCode } from '@/lib/flags';
import { getBadgeTier, getXpLabel } from '@/lib/badgeVisuals';
import { getLocalizedBadgeDescription, getLocalizedBadgeName } from '@/lib/badgeI18n';
import HexBadge from './HexBadge';

const TIER_GRADIENTS: Record<BadgeTier, readonly [string, string, string]> = {
  gold: ['#fff3b0', '#f7c948', '#b7791f'],
  silver: ['#f5f7fa', '#c0cad6', '#5f6f83'],
  bronze: ['#ffe1c2', '#e68a3f', '#8a3f16'],
  xp1: ['#eaf2ff', '#93c5fd', '#2563eb'],
  xp2: ['#e8fff0', '#86efac', '#16a34a'],
  xp3: ['#f2edff', '#c4b5fd', '#7c3aed'],
  platinum: ['#effbff', '#7dd3fc', '#0369a1'],
  diamond: ['#ecfeff', '#67e8f9', '#0e7490'],
  neutral: ['#f8fafc', '#e2e8f0', '#94a3b8'],
};

function formatEarnedDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function getTierLabel(tier: BadgeTier, t: (key: string) => string, code?: string | null) {
  const xpLabel = getXpLabel(code);
  if (xpLabel) return xpLabel;
  switch (tier) {
    case 'gold':
      return t('profile.badgeTier.gold');
    case 'silver':
      return t('profile.badgeTier.silver');
    case 'bronze':
      return t('profile.badgeTier.bronze');
    case 'platinum':
      return t('profile.badgeTier.platinum');
    case 'diamond':
      return t('profile.badgeTier.diamond');
    default:
      return t('profile.badgeTier.neutral');
  }
}

export default function ProfileBadgesContainer({
  badges = [],
  title = 'Badges',
  onViewAll,
}: ProfileBadgesContainerProps) {
  const theme = useColorTheme();
  const styles = profileBadgesContainerStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);

  const selectedBadgeTier = getBadgeTier(selectedBadge?.code, selectedBadge?.criteria);
  const selectedTierPalette = BADGE_TIER_PALETTE[selectedBadgeTier];
  const selectedTierGradients = TIER_GRADIENTS[selectedBadgeTier];
  const selectedAccentTextColor = selectedTierPalette.text;
  const selectedBadgeDate = useMemo(
    () => formatEarnedDate(selectedBadge?.earnedDate),
    [selectedBadge?.earnedDate]
  );
  const selectedBadgeLocation = selectedBadge?.city
    ? `${selectedBadge.city} · ${normalizeCountryCode(selectedBadge.countryCode)}`
    : null;
  const selectedBadgeTierLabel = getTierLabel(selectedBadgeTier, t, selectedBadge?.code);
  const selectedBadgeLocalizedName = selectedBadge
    ? getLocalizedBadgeName(t, selectedBadge.code, selectedBadge.name)
    : '';
  const selectedBadgeLocalizedDescription = selectedBadge
    ? getLocalizedBadgeDescription(t, selectedBadge.code, selectedBadge.description)
    : '';
  const selectedBadgeHasTour = Boolean(selectedBadge?.sourceTourId);
  const handleSourceTourPress = () => {
    if (!selectedBadge?.sourceTourId) return;
    const tourId = selectedBadge.sourceTourId.toString();
    setSelectedBadge(null);
    router.push({
      pathname: '/tour/[id]',
      params: { id: tourId },
    });
  };

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
        {badges.map((badge) => {
          const localizedName = getLocalizedBadgeName(t, badge.code, badge.name);
          return (
            <Pressable
              key={badge.id}
              style={[styles.badgeCard, badge.unlocked && styles.badgeCardUnlocked]}
              onPress={() => setSelectedBadge(badge)}
            >
              <HexBadge
                code={badge.code}
                badgeCriteria={badge.criteria}
                iconUrl={badge.icon}
                city={badge.city}
                countryCode={badge.countryCode}
                fallbackLabel={localizedName}
                visualConfig={badge.visualConfig as any}
              />
              <Text style={styles.badgeName} numberOfLines={2}>
                {localizedName}
              </Text>
              {badge.city ? (
                <Text style={styles.badgeMetaText} numberOfLines={1}>
                  {badge.city} · {normalizeCountryCode(badge.countryCode)}
                </Text>
              ) : null}
            </Pressable>
          );
        })}

        {badges.length > 3 && onViewAll && (
          <TouchableOpacity style={styles.viewAllCard} activeOpacity={0.7} onPress={onViewAll}>
            <Ionicons name="grid-outline" size={22} color={color.primary} />
            <Text style={styles.viewAllText}>{t('profile.viewAllBadges')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable style={styles.detailsOverlay} onPress={() => setSelectedBadge(null)}>
          <Pressable
            style={[
              styles.detailsCard,
              {
                borderColor: selectedTierPalette.border,
                shadowColor: selectedTierPalette.border,
              },
            ]}
          >
            {selectedBadge ? (
              <>
                <LinearGradient
                  colors={selectedTierGradients}
                  locations={[0, 0.58, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detailsGradient}
                />
                <View style={styles.detailsTint} />

                <Pressable style={styles.detailsCloseButton} onPress={() => setSelectedBadge(null)}>
                  <Ionicons name="close" size={18} color={selectedAccentTextColor} />
                </Pressable>

                <View style={styles.detailsBadgeShell}>
                  <HexBadge
                    code={selectedBadge.code}
                    badgeCriteria={selectedBadge.criteria}
                    iconUrl={selectedBadge.icon}
                    city={selectedBadge.city}
                    countryCode={selectedBadge.countryCode}
                    fallbackLabel={selectedBadgeLocalizedName}
                    visualConfig={selectedBadge.visualConfig as any}
                    scale={1.45}
                  />
                </View>

                <Text style={[styles.detailsTier, { color: selectedAccentTextColor }]}>
                  {selectedBadgeTierLabel}
                </Text>
                <Text style={styles.detailsName}>{selectedBadgeLocalizedName}</Text>
                {selectedBadgeLocalizedDescription ? (
                  <Text style={styles.detailsDescription}>{selectedBadgeLocalizedDescription}</Text>
                ) : null}

                <View style={styles.detailsInfoGrid}>
                  {selectedBadgeLocation ? (
                    <View style={styles.detailsInfoItem}>
                      <Ionicons name="location-outline" size={16} color={selectedAccentTextColor} />
                      <Text style={styles.detailsInfoText}>{selectedBadgeLocation}</Text>
                    </View>
                  ) : null}
                  {selectedBadgeDate ? (
                    <View style={styles.detailsInfoItem}>
                      <Ionicons name="calendar-outline" size={16} color={selectedAccentTextColor} />
                      <Text style={styles.detailsInfoText}>{selectedBadgeDate}</Text>
                    </View>
                  ) : null}
                  {selectedBadge.sourceTourTitle ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.detailsInfoItem,
                        selectedBadgeHasTour ? styles.detailsInfoLinkItem : null,
                        pressed && selectedBadgeHasTour ? { opacity: 0.72 } : null,
                      ]}
                      disabled={!selectedBadgeHasTour}
                      onPress={handleSourceTourPress}
                    >
                      <Ionicons name="map-outline" size={16} color={selectedAccentTextColor} />
                      <Text
                        style={[
                          styles.detailsInfoText,
                          selectedBadgeHasTour ? styles.detailsInfoLinkText : null,
                        ]}
                      >
                        {selectedBadge.sourceTourTitle}
                      </Text>
                      {selectedBadgeHasTour ? (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={selectedAccentTextColor}
                        />
                      ) : null}
                    </Pressable>
                  ) : null}
                  {typeof selectedBadge.mistakeCount === 'number' ? (
                    <View style={styles.detailsInfoItem}>
                      <Ionicons name="flag-outline" size={16} color={selectedAccentTextColor} />
                      <Text style={styles.detailsInfoText}>
                        {t('profile.badgeMistakes', {
                          count: selectedBadge.mistakeCount,
                          defaultValue: `${selectedBadge.mistakeCount} mistake${
                            selectedBadge.mistakeCount === 1 ? '' : 's'
                          }`,
                        })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
