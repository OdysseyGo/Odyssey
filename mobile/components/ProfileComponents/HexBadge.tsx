import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';
import CountryFlag from 'react-native-country-flag';

import { BADGE_TIER_PALETTE } from '@/constants/badgeTheme';
import { normalizeCountryCode } from '@/lib/flags';
import { getBadgeTier, getXpLabel, isCityBadge, isXpBadge } from '@/lib/badgeVisuals';

type Props = {
  code?: string | null;
  city?: string;
  countryCode?: string;
  fallbackLabel: string;
};

const WIDTH = 98;
const HEIGHT = 112;
const OUTER_POINTS = '49,2 90,26 90,86 49,110 8,86 8,26';
const MID_POINTS = '49,9 84,30 84,82 49,103 14,82 14,30';
const INNER_POINTS = '49,16 78,33 78,79 49,96 20,79 20,33';

function getTierLabel(code?: string | null): string {
  if (!code) {
    return 'BADGE';
  }
  if (code.startsWith('CITY_')) {
    return code.replace('CITY_', '');
  }
  if (code.startsWith('XP_')) {
    return 'XP';
  }
  return 'BADGE';
}

function getTierGlyph(code?: string | null): string {
  if (!code) {
    return '◆';
  }
  if (code === 'CITY_GOLD') {
    return '★';
  }
  if (code === 'CITY_SILVER') {
    return '✦';
  }
  if (code === 'CITY_BRONZE') {
    return '◆';
  }
  if (code.startsWith('XP_')) {
    return '⬢';
  }
  return '◆';
}

export default function HexBadge({ code, city, countryCode, fallbackLabel }: Props) {
  const tier = getBadgeTier(code);
  const palette = BADGE_TIER_PALETTE[tier];
  const cityText = (city || 'Unknown').trim() || 'Unknown';
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const hasRenderableFlag = normalizedCountryCode !== 'ZZ';
  const xpLabel = getXpLabel(code);
  const tierLabel = getTierLabel(code);
  const tierGlyph = getTierGlyph(code);

  return (
    <View style={[styles.wrap, { shadowColor: palette.border }]}>
      <Svg width={WIDTH} height={HEIGHT}>
        <Defs>
          <LinearGradient id="outerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.outerFill} />
            <Stop offset="100%" stopColor={palette.innerFill} />
          </LinearGradient>
          <LinearGradient id="innerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
            <Stop offset="100%" stopColor={palette.innerFill} stopOpacity={0.9} />
          </LinearGradient>
        </Defs>
        <Polygon points={OUTER_POINTS} fill="url(#outerGrad)" stroke={palette.border} strokeWidth={2} />
        <Polygon
          points={MID_POINTS}
          fill="transparent"
          stroke={palette.border}
          strokeOpacity={0.45}
          strokeWidth={1.25}
        />
        <Polygon points={INNER_POINTS} fill="url(#innerGrad)" />
        <Polygon points="49,18 65,27 65,43 49,52 33,43 33,27" fill="#ffffff" fillOpacity={0.2} />
      </Svg>
      <View style={[styles.tierPill, { backgroundColor: palette.border }]}>
        <Text style={styles.tierPillText}>
          {tierGlyph} {tierLabel}
        </Text>
      </View>
      <View style={styles.content}>
        {isCityBadge(code) ? (
          <>
            <View style={styles.flagWrap}>
              {hasRenderableFlag ? (
                <CountryFlag
                  isoCode={normalizedCountryCode.toLowerCase()}
                  size={20}
                  style={styles.flag}
                />
              ) : (
                <Text style={[styles.flagFallback, { color: palette.text }]}>--</Text>
              )}
            </View>
            <Text style={[styles.primaryText, { color: palette.text }]} numberOfLines={1}>
              {cityText}
            </Text>
            <Text style={[styles.secondaryText, { color: palette.mutedText }]}>City Tour</Text>
          </>
        ) : isXpBadge(code) ? (
          <>
            <Text style={[styles.primaryText, { color: palette.text }]}>{xpLabel || 'XP'}</Text>
            <Text style={[styles.secondaryText, { color: palette.mutedText }]}>Achievement</Text>
          </>
        ) : (
          <Text style={[styles.primaryText, { color: palette.text }]} numberOfLines={2}>
            {fallbackLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: WIDTH,
    height: HEIGHT,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tierPill: {
    position: 'absolute',
    top: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  tierPillText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  content: {
    position: 'absolute',
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    top: 36,
  },
  flag: {
    borderRadius: 999,
  },
  flagWrap: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagFallback: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryText: {
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  secondaryText: {
    fontSize: 8.5,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
});
