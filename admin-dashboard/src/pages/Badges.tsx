import { useEffect, useId, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

import {
  deleteBadgeVisualOverride,
  exportBadgeVisualConfig,
  getBadgeVisualBundle,
  updateBadgeVisualTemplate,
  upsertBadgeVisualOverride,
} from "@/api/endpoints";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type BadgeRef = {
  id: number;
  code: string;
  name: string;
};

type BadgeTier = "gold" | "silver" | "bronze" | "xp1" | "xp2" | "xp3" | "neutral";
type ScopeMode = "template" | "badge" | "badge_country";
type TransformTarget = "flag" | "text" | "text_plate";
type ResizeMode = "width" | "height" | "proportional";

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

type VisualConfig = {
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
};

type VisualOverride = {
  id: number;
  badge: number | null;
  badge_code?: string;
  country_code: string;
  config: Partial<VisualConfig>;
  updated_at: string;
};

type BundleResponse = {
  template: VisualConfig;
  overrides: VisualOverride[];
  badges: BadgeRef[];
};

type CountryOption = {
  code: string;
  name: string;
};

const VIEW_W = 100;
const VIEW_H = 104;
const PREVIEW_W = 340;
const PREVIEW_H = (PREVIEW_W * VIEW_H) / VIEW_W;
const COMBO_PAGE_SIZE = 72;

const POS_MIN = -2;
const POS_MAX = 3;
const SIZE_MIN = 0.01;
const SIZE_MAX = 3;

const DEFAULT_OUTER_POINTS = "50,6 89.84,29 89.84,75 50,98 10.16,75 10.16,29";
const DEFAULT_INNER_POINTS = "50,12 84.64,32 84.64,72 50,92 15.36,72 15.36,32";
const DEFAULT_FLAG_CLIP = DEFAULT_INNER_POINTS;

const DEFAULT_PALETTE: Record<BadgeTier, TierPalette> = {
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

const ALL_TIERS: BadgeTier[] = ["gold", "silver", "bronze", "xp1", "xp2", "xp3", "neutral"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTierFromBadgeCode(code?: string): BadgeTier {
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

function getCountries(): CountryOption[] {
  const fallback = ["TR", "FR", "DE", "IT", "ES", "US", "GB", "JP", "BR", "CA"];
  try {
    const regions =
      typeof Intl !== "undefined" && (Intl as any).supportedValuesOf
        ? ((Intl as any).supportedValuesOf("region") as string[])
        : fallback;
    const display = new Intl.DisplayNames(["en"], { type: "region" });
    return regions
      .filter((code) => /^[A-Z]{2}$/.test(code))
      .map((code) => ({ code, name: display.of(code) || code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return fallback.map((code) => ({ code, name: code }));
  }
}

function mergeConfig(base: VisualConfig, patch?: Partial<VisualConfig>): VisualConfig {
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

function BadgeRender({
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

export default function Badges() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [template, setTemplate] = useState<VisualConfig | null>(null);
  const [overrides, setOverrides] = useState<VisualOverride[]>([]);
  const [badges, setBadges] = useState<BadgeRef[]>([]);
  const countries = useMemo(() => getCountries(), []);

  const [scope, setScope] = useState<ScopeMode>("template");
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState("TR");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingConfig, setEditingConfig] = useState<VisualConfig | null>(null);

  const [target, setTarget] = useState<TransformTarget>("flag");
  const [selectedTier, setSelectedTier] = useState<BadgeTier>("gold");

  const selectedBadge = useMemo(
    () => badges.find((item) => item.id === selectedBadgeId) || null,
    [badges, selectedBadgeId],
  );

  const overrideMatches = useMemo(() => {
    if (!selectedBadgeId && scope !== "template") {
      return null;
    }
    const country = scope === "badge_country" ? selectedCountryCode : "";
    const badge = scope === "template" ? null : selectedBadgeId;
    return (
      overrides.find(
        (item) => item.badge === badge && item.country_code === country,
      ) || null
    );
  }, [overrides, scope, selectedBadgeId, selectedCountryCode]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const { data } = await getBadgeVisualBundle();
        if (!mounted) return;
        const response = data as BundleResponse;
        setTemplate(response.template);
        setOverrides(response.overrides || []);
        setBadges(response.badges || []);
        if (response.badges?.length) {
          const firstBadge = response.badges[0];
          setSelectedBadgeId((prev) => prev ?? firstBadge.id);
          setSelectedTier(getTierFromBadgeCode(firstBadge.code));
        }
      } catch {
        if (mounted) setError("Unable to load badge visuals.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!template) return;
    if (scope === "template") {
      setEditingConfig(template);
    } else {
      setEditingConfig(mergeConfig(template, overrideMatches?.config));
    }
  }, [template, scope, overrideMatches]);

  useEffect(() => {
    if (!selectedBadge) return;
    setSelectedTier(getTierFromBadgeCode(selectedBadge.code));
  }, [selectedBadge]);

  const badgeOverrideMap = useMemo(() => {
    const map = new Map<number, Partial<VisualConfig>>();
    for (const item of overrides) {
      if (item.badge && !item.country_code) {
        map.set(item.badge, item.config);
      }
    }
    return map;
  }, [overrides]);

  const badgeCountryOverrideMap = useMemo(() => {
    const map = new Map<string, Partial<VisualConfig>>();
    for (const item of overrides) {
      if (item.badge && item.country_code) {
        map.set(`${item.badge}:${item.country_code}`, item.config);
      }
    }
    return map;
  }, [overrides]);

  const comboRows = useMemo(() => {
    if (!template) {
      return {
        total: 0,
        pageSize: COMBO_PAGE_SIZE,
        items: [] as Array<{
          id: string;
          badge: BadgeRef;
          country: CountryOption;
          config: VisualConfig;
        }>,
      };
    }
    const normalized = query.trim().toLowerCase();
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const pageSize = COMBO_PAGE_SIZE;

    const buildRow = (badge: BadgeRef, country: CountryOption) => {
      const badgePatch = badgeOverrideMap.get(badge.id);
      const countryPatch = badgeCountryOverrideMap.get(`${badge.id}:${country.code}`);
      return {
        id: `${badge.id}-${country.code}`,
        badge,
        country,
        config: mergeConfig(mergeConfig(template, badgePatch), countryPatch),
      };
    };

    if (!tokens.length) {
      const total = badges.length * countries.length;
      const start = (page - 1) * pageSize;
      const end = Math.min(total, start + pageSize);
      const items: Array<{
        id: string;
        badge: BadgeRef;
        country: CountryOption;
        config: VisualConfig;
      }> = [];

      for (let flat = start; flat < end; flat += 1) {
        const badgeIndex = Math.floor(flat / countries.length);
        const countryIndex = flat % countries.length;
        const badge = badges[badgeIndex];
        const country = countries[countryIndex];
        if (!badge || !country) continue;
        items.push(buildRow(badge, country));
      }
      return { total, pageSize, items };
    }

    const rows: Array<{ badge: BadgeRef; country: CountryOption }> = [];
    for (const badge of badges) {
      const badgeText = `${badge.code} ${badge.name}`.toLowerCase();
      for (const country of countries) {
        const countryText = `${country.code} ${country.name}`.toLowerCase();
        const searchable = `${badgeText} ${countryText}`;
        const matches = tokens.every((token) => searchable.includes(token));
        if (!matches) continue;
        rows.push({ badge, country });
      }
    }
    const start = (page - 1) * pageSize;
    const end = Math.min(rows.length, start + pageSize);
    const items = rows.slice(start, end).map((row) => buildRow(row.badge, row.country));
    return {
      total: rows.length,
      pageSize,
      items,
    };
  }, [template, countries, query, badges, page, badgeOverrideMap, badgeCountryOverrideMap]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(comboRows.total / comboRows.pageSize));
    setPage((current) => Math.min(current, pageCount));
  }, [comboRows.total, comboRows.pageSize]);

  function updateFlag(partial: Partial<VisualConfig["flag"]>) {
    setEditingConfig((prev) =>
      prev ? { ...prev, flag: { ...prev.flag, ...partial } } : prev,
    );
  }

  function updateText(partial: Partial<VisualConfig["text"]>) {
    setEditingConfig((prev) =>
      prev ? { ...prev, text: { ...prev.text, ...partial } } : prev,
    );
  }

  function updateTextPlate(partial: Partial<VisualConfig["text_plate"]>) {
    setEditingConfig((prev) =>
      prev ? { ...prev, text_plate: { ...prev.text_plate, ...partial } } : prev,
    );
  }

  function updateTierPalette(partial: Partial<TierPalette>) {
    setEditingConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        palette: {
          ...prev.palette,
          [selectedTier]: { ...prev.palette[selectedTier], ...partial },
        },
      };
    });
  }

  function onPointerDownMove(currentTarget: TransformTarget, event: ReactMouseEvent<HTMLDivElement>) {
    if (!editingConfig) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;

    const flagStart = { ...editingConfig.flag };
    const textStart = { ...editingConfig.text };
    const textPlateStart = { ...editingConfig.text_plate };

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / PREVIEW_W;
      const dy = (moveEvent.clientY - startY) / PREVIEW_H;

      if (currentTarget === "flag") {
        updateFlag({
          x: clamp(flagStart.x + dx, POS_MIN, POS_MAX),
          y: clamp(flagStart.y + dy, POS_MIN, POS_MAX),
        });
        return;
      }

      if (currentTarget === "text") {
        updateText({
          x: clamp(textStart.x + dx, POS_MIN, POS_MAX),
          y: clamp(textStart.y + dy, POS_MIN, POS_MAX),
        });
        return;
      }

      updateTextPlate({
        x: clamp(textPlateStart.x + dx, POS_MIN, POS_MAX),
        y: clamp(textPlateStart.y + dy, POS_MIN, POS_MAX),
      });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function onPointerDownResize(mode: ResizeMode, event: ReactMouseEvent<HTMLDivElement>) {
    if (!editingConfig) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const flagStart = { ...editingConfig.flag };
    const textStart = { ...editingConfig.text };
    const plateStart = { ...editingConfig.text_plate };

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / PREVIEW_W;
      const dy = (moveEvent.clientY - startY) / PREVIEW_H;

      if (target === "text") {
        let scaleX = textStart.scale_x || 1;
        let scaleY = textStart.scale_y || 1;
        if (mode === "width") {
          scaleX = clamp((textStart.scale_x || 1) + dx * 2, 0.2, 4);
        } else if (mode === "height") {
          scaleY = clamp((textStart.scale_y || 1) + dy * 2, 0.2, 4);
        } else {
          const delta = Math.max(dx, dy) * 2;
          scaleX = clamp((textStart.scale_x || 1) + delta, 0.2, 4);
          scaleY = clamp((textStart.scale_y || 1) + delta, 0.2, 4);
        }
        updateText({ scale_x: scaleX, scale_y: scaleY });
        return;
      }

      const start = target === "flag" ? flagStart : plateStart;
      let width = start.width;
      let height = start.height;
      if (mode === "width") width = clamp(start.width + dx, SIZE_MIN, SIZE_MAX);
      else if (mode === "height") height = clamp(start.height + dy, SIZE_MIN, SIZE_MAX);
      else {
        const delta = Math.max(dx, dy);
        width = clamp(start.width + delta, SIZE_MIN, SIZE_MAX);
        height = clamp(start.height + delta, SIZE_MIN, SIZE_MAX);
      }
      if (target === "flag") {
        updateFlag({ width, height });
      } else {
        updateTextPlate({ width, height });
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  async function handleSave() {
    if (!editingConfig) return;
    setSaving(true);
    setError(null);
    try {
      if (scope === "template") {
        const { data } = await updateBadgeVisualTemplate(editingConfig);
        setTemplate(data.config as VisualConfig);
      } else {
        const { data } = await upsertBadgeVisualOverride({
          badge: selectedBadgeId,
          country_code: scope === "badge_country" ? selectedCountryCode : "",
          config: editingConfig,
        });
        const upserted = data as VisualOverride;
        setOverrides((prev) => [...prev.filter((item) => item.id !== upserted.id), upserted]);
      }
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOverride() {
    if (!overrideMatches) return;
    try {
      await deleteBadgeVisualOverride(overrideMatches.id);
      setOverrides((prev) => prev.filter((item) => item.id !== overrideMatches.id));
    } catch {
      setError("Unable to delete override.");
    }
  }

  async function handleExportJson() {
    try {
      const response = await exportBadgeVisualConfig();
      const blob = new Blob([response.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "badge_visuals.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Unable to export badge visuals JSON.");
    }
  }

  function loadComboIntoEditor(badgeId: number, countryCode: string) {
    setSelectedBadgeId(badgeId);
    setSelectedCountryCode(countryCode);
    setScope("badge_country");
  }

  if (loading || !template || !editingConfig) {
    return <div className="p-8 text-sm text-slate-600">Loading badge studio…</div>;
  }

  const pageCount = Math.max(1, Math.ceil(comboRows.total / comboRows.pageSize));
  const label = selectedBadge
    ? `${selectedBadge.code} · ${selectedCountryCode}`
    : selectedCountryCode;

  const activeTransform =
    target === "flag"
      ? editingConfig.flag
      : target === "text"
        ? editingConfig.text
        : editingConfig.text_plate;

  const activeX = target === "text" ? editingConfig.text.x : activeTransform.x;
  const activeY = target === "text" ? editingConfig.text.y : activeTransform.y;
  const activeRotation =
    target === "flag"
      ? editingConfig.flag.rotation_deg
      : target === "text"
        ? editingConfig.text.rotation_deg
        : editingConfig.text_plate.rotation_deg;

  const targetBox =
    target === "flag"
      ? {
          left: editingConfig.flag.x * PREVIEW_W,
          top: editingConfig.flag.y * PREVIEW_H,
          width: editingConfig.flag.width * PREVIEW_W,
          height: editingConfig.flag.height * PREVIEW_H,
        }
      : target === "text"
        ? {
            left: editingConfig.text.x * PREVIEW_W - 40 * (editingConfig.text.scale_x || 1),
            top: editingConfig.text.y * PREVIEW_H - 14 * (editingConfig.text.scale_y || 1),
            width: 80 * (editingConfig.text.scale_x || 1),
            height: 28 * (editingConfig.text.scale_y || 1),
          }
        : {
            left: editingConfig.text_plate.x * PREVIEW_W,
            top: editingConfig.text_plate.y * PREVIEW_H,
            width: editingConfig.text_plate.width * PREVIEW_W,
            height: editingConfig.text_plate.height * PREVIEW_H,
          };

  const tierPalette = editingConfig.palette?.[selectedTier] || DEFAULT_PALETTE[selectedTier];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Badge Studio</h1>
        <p className="mt-1 text-sm text-slate-600">
          Full editor: drag, angle, resize modes, tier colors, and searchable combination editing.
        </p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 py-3 text-sm text-red-700">{error}</Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Editor Controls</h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scope</label>
            <Select value={scope} onChange={(e) => setScope(e.target.value as ScopeMode)} className="w-full">
              <option value="template">Global template</option>
              <option value="badge">Badge override</option>
              <option value="badge_country">Badge + country override</option>
            </Select>
          </div>

          {scope !== "template" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Badge</label>
              <Select
                value={selectedBadgeId || ""}
                onChange={(e) => setSelectedBadgeId(Number(e.target.value))}
                className="w-full"
              >
                {badges.map((badge) => (
                  <option key={badge.id} value={badge.id}>
                    {badge.code} · {badge.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {scope === "badge_country" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Country</label>
              <Select value={selectedCountryCode} onChange={(e) => setSelectedCountryCode(e.target.value)} className="w-full">
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transform target</label>
            <Select value={target} onChange={(e) => setTarget(e.target.value as TransformTarget)} className="w-full">
              <option value="flag">Flag</option>
              <option value="text">Text</option>
              <option value="text_plate">Text background</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={activeX}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (target === "flag") updateFlag({ x: value });
                else if (target === "text") updateText({ x: value });
                else updateTextPlate({ x: value });
              }}
            />
            <Input
              type="number"
              value={activeY}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (target === "flag") updateFlag({ y: value });
                else if (target === "text") updateText({ y: value });
                else updateTextPlate({ y: value });
              }}
            />
            <Input
              type="number"
              value={activeRotation}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (target === "flag") updateFlag({ rotation_deg: value });
                else if (target === "text") updateText({ rotation_deg: value });
                else updateTextPlate({ rotation_deg: value });
              }}
            />
            {target !== "text" ? (
              <Input
                type="number"
                value={target === "flag" ? editingConfig.flag.width : editingConfig.text_plate.width}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (target === "flag") updateFlag({ width: value });
                  else updateTextPlate({ width: value });
                }}
              />
            ) : (
              <Input
                type="number"
                value={editingConfig.text.scale_x}
                onChange={(e) => updateText({ scale_x: Number(e.target.value) })}
              />
            )}
            {target !== "text" ? (
              <Input
                type="number"
                value={target === "flag" ? editingConfig.flag.height : editingConfig.text_plate.height}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (target === "flag") updateFlag({ height: value });
                  else updateTextPlate({ height: value });
                }}
              />
            ) : (
              <Input
                type="number"
                value={editingConfig.text.scale_y}
                onChange={(e) => updateText({ scale_y: Number(e.target.value) })}
              />
            )}
            {target === "text" ? (
              <>
                <Input
                  type="number"
                  value={editingConfig.text.font_scale}
                  onChange={(e) => updateText({ font_scale: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  value={editingConfig.text.max_chars || 22}
                  onChange={(e) => updateText({ max_chars: Number(e.target.value) })}
                />
              </>
            ) : null}
            {target === "text_plate" ? (
              <Input
                type="number"
                value={editingConfig.text_plate.shape_tl}
                onChange={(e) => updateTextPlate({ shape_tl: Number(e.target.value) })}
              />
            ) : null}
            {target === "text_plate" ? (
              <Input
                type="number"
                value={editingConfig.text_plate.shape_tr}
                onChange={(e) => updateTextPlate({ shape_tr: Number(e.target.value) })}
              />
            ) : null}
            {target === "text_plate" ? (
              <Input
                type="number"
                value={editingConfig.text_plate.shape_br}
                onChange={(e) => updateTextPlate({ shape_br: Number(e.target.value) })}
              />
            ) : null}
            {target === "text_plate" ? (
              <Input
                type="number"
                value={editingConfig.text_plate.shape_bl}
                onChange={(e) => updateTextPlate({ shape_bl: Number(e.target.value) })}
              />
            ) : null}
          </div>

          {target === "text_plate" ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shape Presets</div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => updateTextPlate({ shape_tl: 0, shape_tr: 1, shape_br: 1, shape_bl: 0 })}>Rectangle</Button>
                <Button type="button" variant="outline" onClick={() => updateTextPlate({ shape_tl: 0.2, shape_tr: 0.8, shape_br: 1, shape_bl: 0 })}>Trapezoid</Button>
                <Button type="button" variant="outline" onClick={() => updateTextPlate({ shape_tl: 0.5, shape_tr: 0.5, shape_br: 1, shape_bl: 0 })}>Triangle Up</Button>
                <Button type="button" variant="outline" onClick={() => updateTextPlate({ shape_tl: 0, shape_tr: 1, shape_br: 0.5, shape_bl: 0.5 })}>Triangle Down</Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tier colors</div>
            <Select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value as BadgeTier)} className="w-full">
              {ALL_TIERS.map((tier) => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">Outer
                <Input
                  type="color"
                  value={tierPalette.outer_fill}
                  onChange={(e) => updateTierPalette({ outer_fill: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2">Inner
                <Input
                  type="color"
                  value={tierPalette.inner_fill}
                  onChange={(e) => updateTierPalette({ inner_fill: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2">Border
                <Input
                  type="color"
                  value={tierPalette.border}
                  onChange={(e) => updateTierPalette({ border: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2">Text
                <Input
                  type="color"
                  value={tierPalette.text}
                  onChange={(e) => updateTierPalette({ text: e.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Border edge colors (tier)</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">Outer edge
                <Input type="color" value={tierPalette.border_color} onChange={(e) => updateTierPalette({ border_color: e.target.value })} />
              </label>
              <label className="flex items-center gap-2">Inner edge
                <Input type="color" value={tierPalette.inner_border_color} onChange={(e) => updateTierPalette({ inner_border_color: e.target.value })} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Border band fill (tier)</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">Top
                <Input type="color" value={tierPalette.frame_fill_top} onChange={(e) => updateTierPalette({ frame_fill_top: e.target.value })} />
              </label>
              <label className="flex items-center gap-2">Bottom
                <Input type="color" value={tierPalette.frame_fill_bottom} onChange={(e) => updateTierPalette({ frame_fill_bottom: e.target.value })} />
              </label>
              <label className="flex items-center gap-2">Opacity
                <Input type="number" min="0" max="1" step="0.05" value={tierPalette.frame_fill_opacity} onChange={(e) => updateTierPalette({ frame_fill_opacity: Number(e.target.value) })} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Badge interior fill (tier)</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">Top
                <Input type="color" value={tierPalette.fill_top} onChange={(e) => updateTierPalette({ fill_top: e.target.value })} />
              </label>
              <label className="flex items-center gap-2">Bottom
                <Input type="color" value={tierPalette.fill_bottom} onChange={(e) => updateTierPalette({ fill_bottom: e.target.value })} />
              </label>
              <label className="flex items-center gap-2">Opacity
                <Input type="number" min="0" max="1" step="0.05" value={tierPalette.fill_opacity} onChange={(e) => updateTierPalette({ fill_opacity: Number(e.target.value) })} />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Text plate colors (tier)</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">Fill
                <Input type="color" value={tierPalette.text_plate_fill} onChange={(e) => updateTierPalette({ text_plate_fill: e.target.value })} />
              </label>
              <label className="flex items-center gap-2">Stroke
                <Input type="color" value={tierPalette.text_plate_stroke} onChange={(e) => updateTierPalette({ text_plate_stroke: e.target.value })} />
              </label>
              <label className="flex items-center gap-2">Fill opacity
                <Input type="number" min="0" max="1" step="0.05" value={tierPalette.text_plate_fill_opacity} onChange={(e) => updateTierPalette({ text_plate_fill_opacity: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-2">Stroke opacity
                <Input type="number" min="0" max="1" step="0.05" value={tierPalette.text_plate_stroke_opacity} onChange={(e) => updateTierPalette({ text_plate_stroke_opacity: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-2">Stroke width
                <Input type="number" min="0" max="8" step="0.1" value={tierPalette.text_plate_stroke_width} onChange={(e) => updateTierPalette({ text_plate_stroke_width: Number(e.target.value) })} />
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={handleExportJson}>Export JSON</Button>
            {scope !== "template" && overrideMatches ? (
              <Button variant="destructive" onClick={handleDeleteOverride}>Delete override</Button>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900">Live Editor</h2>
          <div className="relative mx-auto" style={{ width: PREVIEW_W, height: PREVIEW_H }}>
            <BadgeRender
              config={editingConfig}
              countryCode={selectedCountryCode}
              label={label}
              badgeCode={selectedBadge?.code}
            />
            <div
              className="absolute cursor-move border border-dashed border-indigo-600/80"
              onMouseDown={(e) => onPointerDownMove(target, e)}
              style={{
                left: `${targetBox.left}px`,
                top: `${targetBox.top}px`,
                width: `${targetBox.width}px`,
                height: `${targetBox.height}px`,
                background: "rgba(99,102,241,0.06)",
              }}
            >
              <>
                <div
                  className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border border-white bg-indigo-600"
                  onMouseDown={(e) => onPointerDownResize("width", e)}
                  title="Resize width"
                />
                <div
                  className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 cursor-ns-resize rounded-full border border-white bg-indigo-600"
                  onMouseDown={(e) => onPointerDownResize("height", e)}
                  title="Resize height"
                />
                <div
                  className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border border-white bg-indigo-600"
                  onMouseDown={(e) => onPointerDownResize("proportional", e)}
                  title="Proportional corner resize"
                />
              </>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Drag overlay to move selected target. Resize handles: right = width only, bottom = height only, corner = proportional.
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Combination Preview</h2>
            <p className="text-sm text-slate-600">
              {comboRows.total.toLocaleString()} combinations ({badges.length} badges × {countries.length} countries)
            </p>
          </div>
          <Input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search badge code/name or country code/name"
            className="w-80"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {comboRows.items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => loadComboIntoEditor(item.badge.id, item.country.code)}
              className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="mb-2 text-xs font-semibold text-slate-700">
                {item.badge.code} · {item.badge.name} · {item.country.code}
              </div>
              <div className="mx-auto" style={{ width: 150, height: (150 * VIEW_H) / VIEW_W }}>
                <BadgeRender
                  config={item.config}
                  countryCode={item.country.code}
                  label={`${item.badge.code} · ${item.country.code}`}
                  badgeCode={item.badge.code}
                />
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <span className="text-sm text-slate-600">Page {page} / {pageCount}</span>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Next</Button>
        </div>
      </Card>
    </div>
  );
}
