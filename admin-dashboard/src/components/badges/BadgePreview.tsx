import { useId } from "react";

export type BadgeTier = "gold" | "silver" | "bronze" | "xp1" | "xp2" | "xp3" | "neutral";

export interface TierPalette {
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
}

export interface VisualConfig {
  flag: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation_deg: number;
    clip_points?: string;
  };
  text: {
    x: number;
    y: number;
    rotation_deg: number;
    font_scale: number;
    scale_x: number;
    scale_y: number;
    max_chars?: number;
  };
  text_plate: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation_deg: number;
    shape_tl: number;
    shape_tr: number;
    shape_br: number;
    shape_bl: number;
  };
  hex: {
    stroke_width: number;
    inner_stroke_width: number;
    outer_points?: string;
    inner_points?: string;
  };
  palette: Record<BadgeTier, TierPalette>;
}

const VIEW_W = 100;
const VIEW_H = 104;
const DEFAULT_OUTER_POINTS = "50,6 89.84,29 89.84,75 50,98 10.16,75 10.16,29";
const DEFAULT_INNER_POINTS = "50,12 84.64,32 84.64,72 50,92 15.36,72 15.36,32";
const DEFAULT_FLAG_CLIP = DEFAULT_INNER_POINTS;
const ALL_TIERS: BadgeTier[] = ["gold", "silver", "bronze", "xp1", "xp2", "xp3", "neutral"];

export const DEFAULT_PALETTE: Record<BadgeTier, TierPalette> = {
  gold: {
    outer_fill: "#fef3c7",
    inner_fill: "#fcd34d",
    border: "#b45309",
    text: "#78350f",
    border_color: "#b45309",
    inner_border_color: "#b45309",
    frame_fill_top: "#ffffff",
    frame_fill_bottom: "#dbe4f4",
    frame_fill_opacity: 0.98,
    fill_top: "#f8fafc",
    fill_bottom: "#e2e8f0",
    fill_opacity: 0.24,
    text_plate_fill: "#ffffff",
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: "#b45309",
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  silver: {
    outer_fill: "#f1f5f9",
    inner_fill: "#cbd5e1",
    border: "#475569",
    text: "#1e293b",
    border_color: "#475569",
    inner_border_color: "#475569",
    frame_fill_top: "#ffffff",
    frame_fill_bottom: "#dbe4f4",
    frame_fill_opacity: 0.98,
    fill_top: "#f8fafc",
    fill_bottom: "#e2e8f0",
    fill_opacity: 0.24,
    text_plate_fill: "#ffffff",
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: "#475569",
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  bronze: {
    outer_fill: "#ffedd5",
    inner_fill: "#fdba74",
    border: "#9a3412",
    text: "#7c2d12",
    border_color: "#9a3412",
    inner_border_color: "#9a3412",
    frame_fill_top: "#ffffff",
    frame_fill_bottom: "#dbe4f4",
    frame_fill_opacity: 0.98,
    fill_top: "#f8fafc",
    fill_bottom: "#e2e8f0",
    fill_opacity: 0.24,
    text_plate_fill: "#ffffff",
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: "#9a3412",
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  xp1: {
    outer_fill: "#dbeafe",
    inner_fill: "#93c5fd",
    border: "#1d4ed8",
    text: "#1e3a8a",
    border_color: "#1d4ed8",
    inner_border_color: "#1d4ed8",
    frame_fill_top: "#ffffff",
    frame_fill_bottom: "#dbe4f4",
    frame_fill_opacity: 0.98,
    fill_top: "#f8fafc",
    fill_bottom: "#e2e8f0",
    fill_opacity: 0.24,
    text_plate_fill: "#ffffff",
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: "#1d4ed8",
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  xp2: {
    outer_fill: "#dcfce7",
    inner_fill: "#86efac",
    border: "#15803d",
    text: "#14532d",
    border_color: "#15803d",
    inner_border_color: "#15803d",
    frame_fill_top: "#ffffff",
    frame_fill_bottom: "#dbe4f4",
    frame_fill_opacity: 0.98,
    fill_top: "#f8fafc",
    fill_bottom: "#e2e8f0",
    fill_opacity: 0.24,
    text_plate_fill: "#ffffff",
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: "#15803d",
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  xp3: {
    outer_fill: "#ede9fe",
    inner_fill: "#c4b5fd",
    border: "#6d28d9",
    text: "#4c1d95",
    border_color: "#6d28d9",
    inner_border_color: "#6d28d9",
    frame_fill_top: "#ffffff",
    frame_fill_bottom: "#dbe4f4",
    frame_fill_opacity: 0.98,
    fill_top: "#f8fafc",
    fill_bottom: "#e2e8f0",
    fill_opacity: 0.24,
    text_plate_fill: "#ffffff",
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: "#6d28d9",
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
  neutral: {
    outer_fill: "#e2e8f0",
    inner_fill: "#cbd5e1",
    border: "#64748b",
    text: "#0f172a",
    border_color: "#64748b",
    inner_border_color: "#64748b",
    frame_fill_top: "#ffffff",
    frame_fill_bottom: "#dbe4f4",
    frame_fill_opacity: 0.98,
    fill_top: "#f8fafc",
    fill_bottom: "#e2e8f0",
    fill_opacity: 0.24,
    text_plate_fill: "#ffffff",
    text_plate_fill_opacity: 0.78,
    text_plate_stroke: "#64748b",
    text_plate_stroke_opacity: 0.7,
    text_plate_stroke_width: 1,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getTierFromBadgeCode(code?: string): BadgeTier {
  if (!code) return "neutral";
  if (code === "CITY_GOLD") return "gold";
  if (code === "CITY_SILVER") return "silver";
  if (code === "CITY_BRONZE") return "bronze";
  if (code === "XP_100") return "xp1";
  if (code === "XP_500") return "xp2";
  if (code === "XP_1000") return "xp3";
  return "neutral";
}

function mergePalette(
  base: Record<BadgeTier, TierPalette>,
  patch?: Partial<Record<BadgeTier, Partial<TierPalette>>>,
): Record<BadgeTier, TierPalette> {
  const merged = { ...base } as Record<BadgeTier, TierPalette>;
  for (const tier of ALL_TIERS) {
    merged[tier] = {
      ...base[tier],
      ...((patch && patch[tier]) || {}),
    };
  }
  return merged;
}

export function mergeBadgeConfig(base: VisualConfig, patch?: Partial<VisualConfig>): VisualConfig {
  const mergedPalette = mergePalette(base.palette || DEFAULT_PALETTE, patch?.palette as any);
  return {
    hex: { ...base.hex, ...(patch?.hex || {}) },
    flag: { ...base.flag, ...(patch?.flag || {}) },
    text: { ...base.text, ...(patch?.text || {}) },
    text_plate: { ...base.text_plate, ...(patch?.text_plate || {}) },
    palette: mergedPalette,
  };
}

function flagUrl(countryCode: string) {
  return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
}

function asPoints(points: Array<[number, number]>) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function rotatePoint(x: number, y: number, cx: number, cy: number, angleDeg: number) {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const tx = x - cx;
  const ty = y - cy;
  return {
    x: cx + tx * cos - ty * sin,
    y: cy + tx * sin + ty * cos,
  };
}

function textPlatePoints(textPlate: VisualConfig["text_plate"]) {
  const x = textPlate.x * VIEW_W;
  const y = textPlate.y * VIEW_H;
  const width = textPlate.width * VIEW_W;
  const height = textPlate.height * VIEW_H;
  const p1: [number, number] = [x + clamp(textPlate.shape_tl, -0.5, 1.5) * width, y];
  const p2: [number, number] = [x + clamp(textPlate.shape_tr, -0.5, 1.5) * width, y];
  const p3: [number, number] = [x + clamp(textPlate.shape_br, -0.5, 1.5) * width, y + height];
  const p4: [number, number] = [x + clamp(textPlate.shape_bl, -0.5, 1.5) * width, y + height];

  const cx = x + width / 2;
  const cy = y + height / 2;
  const angle = textPlate.rotation_deg;

  const rotated = [p1, p2, p3, p4].map((point) => {
    const rotatedPoint = rotatePoint(point[0], point[1], cx, cy, angle);
    return [rotatedPoint.x, rotatedPoint.y] as [number, number];
  });

  return asPoints(rotated);
}

function pivotTransform(x: number, y: number, rotation: number, scaleX: number, scaleY: number) {
  return `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY}) translate(${-x}, ${-y})`;
}

function clampText(input: string, maxChars: number) {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, Math.max(1, maxChars - 1))}…`;
}

export function BadgePreview({
  config,
  countryCode,
  label,
  badgeCode,
}: {
  config: VisualConfig;
  countryCode: string;
  label: string;
  badgeCode?: string;
}) {
  const clipId = useId().replace(/:/g, "_");
  const flagX = VIEW_W * config.flag.x;
  const flagY = VIEW_H * config.flag.y;
  const flagWidth = VIEW_W * config.flag.width;
  const flagHeight = VIEW_H * config.flag.height;
  const centerX = flagX + flagWidth / 2;
  const centerY = flagY + flagHeight / 2;
  const textX = VIEW_W * config.text.x;
  const textY = VIEW_H * config.text.y;
  const tier = getTierFromBadgeCode(badgeCode);
  const palette = config.palette?.[tier] || DEFAULT_PALETTE[tier];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="100%">
      <defs>
        <linearGradient id={`${clipId}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.frame_fill_top} stopOpacity={palette.frame_fill_opacity} />
          <stop offset="100%" stopColor={palette.frame_fill_bottom} stopOpacity={palette.frame_fill_opacity} />
        </linearGradient>
        <linearGradient id={`${clipId}-plate`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.fill_top} />
          <stop offset="100%" stopColor={palette.fill_bottom} />
        </linearGradient>
        <clipPath id={`${clipId}-flag`}>
          <polygon points={config.flag.clip_points || DEFAULT_FLAG_CLIP} />
        </clipPath>
        <clipPath id={`${clipId}-badge`}>
          <polygon points={config.hex.outer_points || DEFAULT_OUTER_POINTS} />
        </clipPath>
      </defs>

      <polygon
        points={config.hex.outer_points || DEFAULT_OUTER_POINTS}
        fill={`url(#${clipId}-bg)`}
        stroke={palette.border_color}
        strokeWidth={config.hex.stroke_width}
      />
      <polygon
        points={config.hex.inner_points || DEFAULT_INNER_POINTS}
        fill={`url(#${clipId}-plate)`}
        fillOpacity={palette.fill_opacity}
        stroke={palette.inner_border_color}
        strokeOpacity="0.42"
        strokeWidth={config.hex.inner_stroke_width}
      />

      <g clipPath={`url(#${clipId}-badge)`}>
        <g clipPath={`url(#${clipId}-flag)`}>
          <image
            href={flagUrl(countryCode)}
            x={flagX}
            y={flagY}
            width={flagWidth}
            height={flagHeight}
            preserveAspectRatio="xMidYMid slice"
            transform={`rotate(${config.flag.rotation_deg}, ${centerX}, ${centerY})`}
          />
        </g>

        <polygon
          points={textPlatePoints(config.text_plate)}
          fill={palette.text_plate_fill}
          fillOpacity={palette.text_plate_fill_opacity}
          stroke={palette.text_plate_stroke}
          strokeOpacity={palette.text_plate_stroke_opacity}
          strokeWidth={palette.text_plate_stroke_width}
        />

        <text
          x={textX}
          y={textY}
          fill={palette.text}
          fontSize={10 * config.text.font_scale}
          fontWeight="700"
          letterSpacing="0.25"
          textAnchor="middle"
          transform={pivotTransform(
            textX,
            textY,
            config.text.rotation_deg,
            config.text.scale_x || 1,
            config.text.scale_y || 1,
          )}
        >
          {clampText(label, Math.round(config.text.max_chars || 22))}
        </text>
      </g>
    </svg>
  );
}

