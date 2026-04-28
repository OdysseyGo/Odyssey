from copy import deepcopy

from .models import BadgeVisualOverride, BadgeVisualTemplate

DEFAULT_BADGE_VISUAL_CONFIG = {
    "hex": {
        "outer_points": "50,6 89.84,29 89.84,75 50,98 10.16,75 10.16,29",
        "inner_points": "50,12 84.64,32 84.64,72 50,92 15.36,72 15.36,32",
        "stroke_width": 2,
        "inner_stroke_width": 1,
        "border_color": "#64748b",
        "inner_border_color": "#64748b",
        "frame_fill_top": "#ffffff",
        "frame_fill_bottom": "#dbe4f4",
        "frame_fill_opacity": 0.98,
        "fill_top": "#f8fafc",
        "fill_bottom": "#e2e8f0",
        "fill_opacity": 0.24,
    },
    "palette": {
        "gold": {
            "outer_fill": "#fef3c7",
            "inner_fill": "#fcd34d",
            "border": "#b45309",
            "text": "#78350f",
        },
        "silver": {
            "outer_fill": "#f1f5f9",
            "inner_fill": "#cbd5e1",
            "border": "#475569",
            "text": "#1e293b",
        },
        "bronze": {
            "outer_fill": "#ffedd5",
            "inner_fill": "#fdba74",
            "border": "#9a3412",
            "text": "#7c2d12",
        },
        "xp1": {
            "outer_fill": "#dbeafe",
            "inner_fill": "#93c5fd",
            "border": "#1d4ed8",
            "text": "#1e3a8a",
        },
        "xp2": {
            "outer_fill": "#dcfce7",
            "inner_fill": "#86efac",
            "border": "#15803d",
            "text": "#14532d",
        },
        "xp3": {
            "outer_fill": "#ede9fe",
            "inner_fill": "#c4b5fd",
            "border": "#6d28d9",
            "text": "#4c1d95",
        },
        "neutral": {
            "outer_fill": "#e2e8f0",
            "inner_fill": "#cbd5e1",
            "border": "#64748b",
            "text": "#0f172a",
        },
    },
    "flag": {
        "x": -0.2,
        "y": -0.2,
        "width": 1.4,
        "height": 1.4,
        "rotation_deg": -60,
        "clip_points": "50,12 84.64,32 84.64,72 50,92 15.36,72 15.36,32",
    },
    "text": {
        "x": 0.56,
        "y": 0.78,
        "rotation_deg": -60,
        "font_scale": 1.0,
        "scale_x": 1.0,
        "scale_y": 1.0,
        "max_chars": 22,
    },
    "text_plate": {
        "x": 0.18,
        "y": 0.62,
        "width": 0.66,
        "height": 0.2,
        "rotation_deg": -60,
        "shape_tl": 0.18,
        "shape_tr": 1.0,
        "shape_br": 0.82,
        "shape_bl": 0.0,
        "fill": "#ffffff",
        "fill_opacity": 0.78,
        "stroke": "#64748b",
        "stroke_opacity": 0.7,
        "stroke_width": 1.0,
    },
}


def _merge_dict(base: dict, override: dict) -> dict:
    merged = deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _merge_dict(merged[key], value)
        else:
            merged[key] = value
    return merged


def _empty_like_default():
    return deepcopy(DEFAULT_BADGE_VISUAL_CONFIG)


class BadgeVisualService:
    @staticmethod
    def _normalize_country_code(country_code):
        normalized = (country_code or "").strip().upper()
        return normalized[:2]

    @classmethod
    def load_template(cls):
        template = BadgeVisualTemplate.load()
        return _merge_dict(_empty_like_default(), template.config or {})

    @classmethod
    def resolve_config(cls, *, badge=None, country_code=""):
        resolved = cls.load_template()
        normalized_country = cls._normalize_country_code(country_code)

        global_override = (
            BadgeVisualOverride.objects.filter(badge__isnull=True, country_code="")
            .order_by("-updated_at")
            .first()
        )
        if global_override:
            resolved = _merge_dict(resolved, global_override.config or {})

        if badge is not None:
            badge_override = (
                BadgeVisualOverride.objects.filter(badge=badge, country_code="")
                .order_by("-updated_at")
                .first()
            )
            if badge_override:
                resolved = _merge_dict(resolved, badge_override.config or {})

        if badge is not None and normalized_country:
            country_override = (
                BadgeVisualOverride.objects.filter(
                    badge=badge,
                    country_code=normalized_country,
                )
                .order_by("-updated_at")
                .first()
            )
            if country_override:
                resolved = _merge_dict(resolved, country_override.config or {})

        return resolved
