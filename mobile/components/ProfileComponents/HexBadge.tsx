import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Polygon,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { BADGE_TIER_PALETTE } from '@/constants/badgeTheme';
import { normalizeCountryCode } from '@/lib/flags';
import { getBadgeTier, getXpLabel, isCityBadge, isXpBadge } from '@/lib/badgeVisuals';

type BadgeTier = 'gold' | 'silver' | 'bronze' | 'xp1' | 'xp2' | 'xp3' | 'neutral';
type TierPalette = {
  outer_fill: string;
  inner_fill: string;
  border: string;
  text: string;
  border_color: string;
  inner_border_color: string;
  frame_fill_top: string;
  frame_fill_bottom: string;
  frame_fill_opacity: number;
  fill_top: string;
  fill_bottom: string;
  fill_opacity: number;
  text_plate_fill: string;
  text_plate_fill_opacity: number;
  text_plate_stroke: string;
  text_plate_stroke_opacity: number;
  text_plate_stroke_width: number;
};

type BadgeVisualConfig = {
  hex?: {
    outer_points?: string;
    inner_points?: string;
    stroke_width?: number;
    inner_stroke_width?: number;
  };
  flag?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation_deg?: number;
    clip_points?: string;
  };
  text?: {
    x?: number;
    y?: number;
    rotation_deg?: number;
    font_scale?: number;
    scale_x?: number;
    scale_y?: number;
    max_chars?: number;
  };
  text_plate?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation_deg?: number;
    shape_tl?: number;
    shape_tr?: number;
    shape_br?: number;
    shape_bl?: number;
  };
  palette?: Partial<Record<BadgeTier, Partial<TierPalette>>>;
};

type Props = {
  code?: string | null;
  city?: string;
  countryCode?: string;
  fallbackLabel: string;
  visualConfig?: BadgeVisualConfig | null;
  scale?: number;
};

const WIDTH = 100;
const HEIGHT = 104;
const ALL_TIERS: BadgeTier[] = ['gold', 'silver', 'bronze', 'xp1', 'xp2', 'xp3', 'neutral'];
const DEFAULT_VISUAL_PALETTE: Record<BadgeTier, TierPalette> = {
  gold: {
    outer_fill: BADGE_TIER_PALETTE.gold.outerFill,
    inner_fill: BADGE_TIER_PALETTE.gold.innerFill,
    border: BADGE_TIER_PALETTE.gold.border,
    text: BADGE_TIER_PALETTE.gold.text,
    border_color: BADGE_TIER_PALETTE.gold.border,
    inner_border_color: BADGE_TIER_PALETTE.gold.border,
    frame_fill_top: '#ffffff',
    frame_fill_bottom: '#dbe4f4',
    frame_fill_opacity: 0.98,
    fill_top: '#f8fafc',
    fill_bottom: '#e2e8f0',
    fill_opacity: 0.24,
    text_plate_fill: '#ffffff',
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: BADGE_TIER_PALETTE.gold.border,
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  silver: {
    outer_fill: BADGE_TIER_PALETTE.silver.outerFill,
    inner_fill: BADGE_TIER_PALETTE.silver.innerFill,
    border: BADGE_TIER_PALETTE.silver.border,
    text: BADGE_TIER_PALETTE.silver.text,
    border_color: BADGE_TIER_PALETTE.silver.border,
    inner_border_color: BADGE_TIER_PALETTE.silver.border,
    frame_fill_top: '#ffffff',
    frame_fill_bottom: '#dbe4f4',
    frame_fill_opacity: 0.98,
    fill_top: '#f8fafc',
    fill_bottom: '#e2e8f0',
    fill_opacity: 0.24,
    text_plate_fill: '#ffffff',
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: BADGE_TIER_PALETTE.silver.border,
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  bronze: {
    outer_fill: BADGE_TIER_PALETTE.bronze.outerFill,
    inner_fill: BADGE_TIER_PALETTE.bronze.innerFill,
    border: BADGE_TIER_PALETTE.bronze.border,
    text: BADGE_TIER_PALETTE.bronze.text,
    border_color: BADGE_TIER_PALETTE.bronze.border,
    inner_border_color: BADGE_TIER_PALETTE.bronze.border,
    frame_fill_top: '#ffffff',
    frame_fill_bottom: '#dbe4f4',
    frame_fill_opacity: 0.98,
    fill_top: '#f8fafc',
    fill_bottom: '#e2e8f0',
    fill_opacity: 0.24,
    text_plate_fill: '#ffffff',
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: BADGE_TIER_PALETTE.bronze.border,
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  xp1: {
    outer_fill: BADGE_TIER_PALETTE.xp1.outerFill,
    inner_fill: BADGE_TIER_PALETTE.xp1.innerFill,
    border: BADGE_TIER_PALETTE.xp1.border,
    text: BADGE_TIER_PALETTE.xp1.text,
    border_color: BADGE_TIER_PALETTE.xp1.border,
    inner_border_color: BADGE_TIER_PALETTE.xp1.border,
    frame_fill_top: '#ffffff',
    frame_fill_bottom: '#dbe4f4',
    frame_fill_opacity: 0.98,
    fill_top: '#f8fafc',
    fill_bottom: '#e2e8f0',
    fill_opacity: 0.24,
    text_plate_fill: '#ffffff',
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: BADGE_TIER_PALETTE.xp1.border,
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  xp2: {
    outer_fill: BADGE_TIER_PALETTE.xp2.outerFill,
    inner_fill: BADGE_TIER_PALETTE.xp2.innerFill,
    border: BADGE_TIER_PALETTE.xp2.border,
    text: BADGE_TIER_PALETTE.xp2.text,
    border_color: BADGE_TIER_PALETTE.xp2.border,
    inner_border_color: BADGE_TIER_PALETTE.xp2.border,
    frame_fill_top: '#ffffff',
    frame_fill_bottom: '#dbe4f4',
    frame_fill_opacity: 0.98,
    fill_top: '#f8fafc',
    fill_bottom: '#e2e8f0',
    fill_opacity: 0.24,
    text_plate_fill: '#ffffff',
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: BADGE_TIER_PALETTE.xp2.border,
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  xp3: {
    outer_fill: BADGE_TIER_PALETTE.xp3.outerFill,
    inner_fill: BADGE_TIER_PALETTE.xp3.innerFill,
    border: BADGE_TIER_PALETTE.xp3.border,
    text: BADGE_TIER_PALETTE.xp3.text,
    border_color: BADGE_TIER_PALETTE.xp3.border,
    inner_border_color: BADGE_TIER_PALETTE.xp3.border,
    frame_fill_top: '#ffffff',
    frame_fill_bottom: '#dbe4f4',
    frame_fill_opacity: 0.98,
    fill_top: '#f8fafc',
    fill_bottom: '#e2e8f0',
    fill_opacity: 0.24,
    text_plate_fill: '#ffffff',
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: BADGE_TIER_PALETTE.xp3.border,
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  neutral: {
    outer_fill: BADGE_TIER_PALETTE.neutral.outerFill,
    inner_fill: BADGE_TIER_PALETTE.neutral.innerFill,
    border: BADGE_TIER_PALETTE.neutral.border,
    text: BADGE_TIER_PALETTE.neutral.text,
    border_color: BADGE_TIER_PALETTE.neutral.border,
    inner_border_color: BADGE_TIER_PALETTE.neutral.border,
    frame_fill_top: '#ffffff',
    frame_fill_bottom: '#dbe4f4',
    frame_fill_opacity: 0.98,
    fill_top: '#f8fafc',
    fill_bottom: '#e2e8f0',
    fill_opacity: 0.24,
    text_plate_fill: '#ffffff',
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: BADGE_TIER_PALETTE.neutral.border,
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
};

const DEFAULT_CONFIG: Required<BadgeVisualConfig> = {
  hex: {
    outer_points: '50,6 89.84,29 89.84,75 50,98 10.16,75 10.16,29',
    inner_points: '50,12 84.64,32 84.64,72 50,92 15.36,72 15.36,32',
    stroke_width: 2,
    inner_stroke_width: 1.2,
  },
  flag: {
    x: -0.2,
    y: -0.2,
    width: 1.4,
    height: 1.4,
    rotation_deg: -60,
    clip_points: '50,12 84.64,32 84.64,72 50,92 15.36,72 15.36,32',
  },
  text: {
    x: 0.56,
    y: 0.78,
    rotation_deg: -60,
    font_scale: 1,
    scale_x: 1,
    scale_y: 1,
    max_chars: 22,
  },
  text_plate: {
    x: 0.18,
    y: 0.62,
    width: 0.66,
    height: 0.2,
    rotation_deg: -60,
    shape_tl: 0.18,
    shape_tr: 1,
    shape_br: 0.82,
    shape_bl: 0,
  },
  palette: DEFAULT_VISUAL_PALETTE,
};

function mergeVisualConfig(config?: BadgeVisualConfig | null): Required<BadgeVisualConfig> {
  const basePalette = DEFAULT_VISUAL_PALETTE;
  const mergedPalette = { ...basePalette } as Record<BadgeTier, TierPalette>;
  for (const tier of ALL_TIERS) {
    mergedPalette[tier] = {
      ...basePalette[tier],
      ...((config?.palette && config.palette[tier]) || {}),
    };
  }

  return {
    hex: { ...DEFAULT_CONFIG.hex, ...(config?.hex || {}) },
    flag: { ...DEFAULT_CONFIG.flag, ...(config?.flag || {}) },
    text: { ...DEFAULT_CONFIG.text, ...(config?.text || {}) },
    text_plate: { ...DEFAULT_CONFIG.text_plate, ...(config?.text_plate || {}) },
    palette: mergedPalette,
  };
}

function clampText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, Math.max(1, maxChars - 1))}…`;
}

function buildFlagUrl(countryCode: string): string | null {
  if (!/^[A-Z]{2}$/.test(countryCode) || countryCode === 'ZZ') {
    return null;
  }
  return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angleDeg: number
): [number, number] {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tx = x - cx;
  const ty = y - cy;
  return [cx + tx * cos - ty * sin, cy + tx * sin + ty * cos];
}

function asPoints(points: [number, number][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function buildTextPlatePoints(textPlate: Required<BadgeVisualConfig>['text_plate']): string {
  const x = (textPlate.x ?? 0.18) * WIDTH;
  const y = (textPlate.y ?? 0.62) * HEIGHT;
  const width = (textPlate.width ?? 0.66) * WIDTH;
  const height = (textPlate.height ?? 0.2) * HEIGHT;
  const angle = textPlate.rotation_deg ?? -60;

  const p1: [number, number] = [x + clamp(textPlate.shape_tl ?? 0.18, -0.5, 1.5) * width, y];
  const p2: [number, number] = [x + clamp(textPlate.shape_tr ?? 1, -0.5, 1.5) * width, y];
  const p3: [number, number] = [
    x + clamp(textPlate.shape_br ?? 0.82, -0.5, 1.5) * width,
    y + height,
  ];
  const p4: [number, number] = [x + clamp(textPlate.shape_bl ?? 0, -0.5, 1.5) * width, y + height];

  const cx = x + width / 2;
  const cy = y + height / 2;
  const rotated = [p1, p2, p3, p4].map((point) => rotatePoint(point[0], point[1], cx, cy, angle));

  return asPoints(rotated);
}

function pivotTransform(
  x: number,
  y: number,
  rotation: number,
  scaleX: number,
  scaleY: number
): string {
  return `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY}) translate(${-x}, ${-y})`;
}

export default function HexBadge({
  code,
  city,
  countryCode,
  fallbackLabel,
  visualConfig,
  scale = 1,
}: Props) {
  const tier = getBadgeTier(code);
  const config = mergeVisualConfig(visualConfig);
  const palette = config.palette[tier] || DEFAULT_VISUAL_PALETTE[tier];

  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const flagUrl = buildFlagUrl(normalizedCountryCode);
  const cityText = (city || 'Unknown').trim() || 'Unknown';
  const xpLabel = getXpLabel(code);
  const primaryLabel = isCityBadge(code)
    ? `${cityText} · ${normalizedCountryCode}`
    : isXpBadge(code)
      ? xpLabel || 'XP'
      : fallbackLabel;
  const label = clampText(primaryLabel, Math.round(config.text.max_chars ?? 22));

  const flagX = WIDTH * (config.flag.x ?? -0.2);
  const flagY = HEIGHT * (config.flag.y ?? -0.2);
  const flagWidth = WIDTH * (config.flag.width ?? 1.4);
  const flagHeight = HEIGHT * (config.flag.height ?? 1.4);
  const flagCenterX = flagX + flagWidth / 2;
  const flagCenterY = flagY + flagHeight / 2;

  const textX = WIDTH * (config.text.x ?? 0.56);
  const textY = HEIGHT * (config.text.y ?? 0.79);
  const scaledWidth = WIDTH * scale;
  const scaledHeight = HEIGHT * scale;

  return (
    <View
      style={[
        styles.wrap,
        { width: scaledWidth, height: scaledHeight, shadowColor: palette.border },
      ]}
    >
      <Svg width={scaledWidth} height={scaledHeight} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="hexBackground" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop
              offset="0%"
              stopColor={palette.frame_fill_top}
              stopOpacity={palette.frame_fill_opacity}
            />
            <Stop
              offset="100%"
              stopColor={palette.frame_fill_bottom}
              stopOpacity={palette.frame_fill_opacity}
            />
          </LinearGradient>
          <LinearGradient id="plateFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.fill_top} />
            <Stop offset="100%" stopColor={palette.fill_bottom} />
          </LinearGradient>
          <ClipPath id="flagClip">
            <Polygon points={config.flag.clip_points} />
          </ClipPath>
          <ClipPath id="badgeClip">
            <Polygon points={config.hex.outer_points} />
          </ClipPath>
        </Defs>

        <Polygon
          points={config.hex.outer_points}
          fill="url(#hexBackground)"
          stroke={palette.border_color}
          strokeWidth={config.hex.stroke_width}
        />
        <Polygon
          points={config.hex.inner_points}
          fill="url(#plateFill)"
          fillOpacity={palette.fill_opacity}
          stroke={palette.inner_border_color}
          strokeOpacity={0.42}
          strokeWidth={config.hex.inner_stroke_width}
        />

        <G clipPath="url(#badgeClip)">
          <G clipPath="url(#flagClip)">
            {flagUrl ? (
              <SvgImage
                x={flagX}
                y={flagY}
                width={flagWidth}
                height={flagHeight}
                href={{ uri: flagUrl }}
                preserveAspectRatio="xMidYMid slice"
                transform={`rotate(${config.flag.rotation_deg ?? -60}, ${flagCenterX}, ${flagCenterY})`}
              />
            ) : (
              <Polygon
                points={config.flag.clip_points || DEFAULT_CONFIG.flag.clip_points}
                fill={palette.inner_fill}
                fillOpacity={0.7}
              />
            )}
          </G>

          <Polygon
            points={buildTextPlatePoints(config.text_plate)}
            fill={palette.text_plate_fill}
            fillOpacity={palette.text_plate_fill_opacity}
            stroke={palette.text_plate_stroke}
            strokeOpacity={palette.text_plate_stroke_opacity}
            strokeWidth={palette.text_plate_stroke_width}
          />

          <SvgText
            x={textX}
            y={textY}
            fill={palette.text}
            fontSize={10 * (config.text.font_scale ?? 1)}
            fontWeight="700"
            letterSpacing={0.3}
            textAnchor="middle"
            transform={pivotTransform(
              textX,
              textY,
              config.text.rotation_deg ?? -60,
              config.text.scale_x ?? 1,
              config.text.scale_y ?? 1
            )}
          >
            {label}
          </SvgText>
        </G>
      </Svg>
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
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
