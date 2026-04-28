import json
import os
import threading
from copy import deepcopy
from pathlib import Path

DEFAULT_BADGE_VISUAL_CONFIG = {
    "hex": {
        "outer_points": "50,6 89.84,29 89.84,75 50,98 10.16,75 10.16,29",
        "inner_points": "50,12 84.64,32 84.64,72 50,92 15.36,72 15.36,32",
        "stroke_width": 2,
        "inner_stroke_width": 1,
    },
    "palette": {
        "gold": {
            "outer_fill": "#fef3c7",
            "inner_fill": "#fcd34d",
            "border": "#b45309",
            "text": "#78350f",
            "border_color": "#b45309",
            "inner_border_color": "#b45309",
            "frame_fill_top": "#ffffff",
            "frame_fill_bottom": "#dbe4f4",
            "frame_fill_opacity": 0.98,
            "fill_top": "#f8fafc",
            "fill_bottom": "#e2e8f0",
            "fill_opacity": 0.24,
            "text_plate_fill": "#ffffff",
            "text_plate_fill_opacity": 0.78,
            "text_plate_stroke": "#b45309",
            "text_plate_stroke_opacity": 0.7,
            "text_plate_stroke_width": 1.0,
        },
        "silver": {
            "outer_fill": "#f1f5f9",
            "inner_fill": "#cbd5e1",
            "border": "#475569",
            "text": "#1e293b",
            "border_color": "#475569",
            "inner_border_color": "#475569",
            "frame_fill_top": "#ffffff",
            "frame_fill_bottom": "#dbe4f4",
            "frame_fill_opacity": 0.98,
            "fill_top": "#f8fafc",
            "fill_bottom": "#e2e8f0",
            "fill_opacity": 0.24,
            "text_plate_fill": "#ffffff",
            "text_plate_fill_opacity": 0.78,
            "text_plate_stroke": "#475569",
            "text_plate_stroke_opacity": 0.7,
            "text_plate_stroke_width": 1.0,
        },
        "bronze": {
            "outer_fill": "#ffedd5",
            "inner_fill": "#fdba74",
            "border": "#9a3412",
            "text": "#7c2d12",
            "border_color": "#9a3412",
            "inner_border_color": "#9a3412",
            "frame_fill_top": "#ffffff",
            "frame_fill_bottom": "#dbe4f4",
            "frame_fill_opacity": 0.98,
            "fill_top": "#f8fafc",
            "fill_bottom": "#e2e8f0",
            "fill_opacity": 0.24,
            "text_plate_fill": "#ffffff",
            "text_plate_fill_opacity": 0.78,
            "text_plate_stroke": "#9a3412",
            "text_plate_stroke_opacity": 0.7,
            "text_plate_stroke_width": 1.0,
        },
        "xp1": {
            "outer_fill": "#dbeafe",
            "inner_fill": "#93c5fd",
            "border": "#1d4ed8",
            "text": "#1e3a8a",
            "border_color": "#1d4ed8",
            "inner_border_color": "#1d4ed8",
            "frame_fill_top": "#ffffff",
            "frame_fill_bottom": "#dbe4f4",
            "frame_fill_opacity": 0.98,
            "fill_top": "#f8fafc",
            "fill_bottom": "#e2e8f0",
            "fill_opacity": 0.24,
            "text_plate_fill": "#ffffff",
            "text_plate_fill_opacity": 0.78,
            "text_plate_stroke": "#1d4ed8",
            "text_plate_stroke_opacity": 0.7,
            "text_plate_stroke_width": 1.0,
        },
        "xp2": {
            "outer_fill": "#dcfce7",
            "inner_fill": "#86efac",
            "border": "#15803d",
            "text": "#14532d",
            "border_color": "#15803d",
            "inner_border_color": "#15803d",
            "frame_fill_top": "#ffffff",
            "frame_fill_bottom": "#dbe4f4",
            "frame_fill_opacity": 0.98,
            "fill_top": "#f8fafc",
            "fill_bottom": "#e2e8f0",
            "fill_opacity": 0.24,
            "text_plate_fill": "#ffffff",
            "text_plate_fill_opacity": 0.78,
            "text_plate_stroke": "#15803d",
            "text_plate_stroke_opacity": 0.7,
            "text_plate_stroke_width": 1.0,
        },
        "xp3": {
            "outer_fill": "#ede9fe",
            "inner_fill": "#c4b5fd",
            "border": "#6d28d9",
            "text": "#4c1d95",
            "border_color": "#6d28d9",
            "inner_border_color": "#6d28d9",
            "frame_fill_top": "#ffffff",
            "frame_fill_bottom": "#dbe4f4",
            "frame_fill_opacity": 0.98,
            "fill_top": "#f8fafc",
            "fill_bottom": "#e2e8f0",
            "fill_opacity": 0.24,
            "text_plate_fill": "#ffffff",
            "text_plate_fill_opacity": 0.78,
            "text_plate_stroke": "#6d28d9",
            "text_plate_stroke_opacity": 0.7,
            "text_plate_stroke_width": 1.0,
        },
        "neutral": {
            "outer_fill": "#e2e8f0",
            "inner_fill": "#cbd5e1",
            "border": "#64748b",
            "text": "#0f172a",
            "border_color": "#64748b",
            "inner_border_color": "#64748b",
            "frame_fill_top": "#ffffff",
            "frame_fill_bottom": "#dbe4f4",
            "frame_fill_opacity": 0.98,
            "fill_top": "#f8fafc",
            "fill_bottom": "#e2e8f0",
            "fill_opacity": 0.24,
            "text_plate_fill": "#ffffff",
            "text_plate_fill_opacity": 0.78,
            "text_plate_stroke": "#64748b",
            "text_plate_stroke_opacity": 0.7,
            "text_plate_stroke_width": 1.0,
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
    },
}

_FILE_LOCK = threading.Lock()
_DEFAULT_FILE_NAME = "badge_visuals.json"


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


def _normalize_country_code(country_code: str | None) -> str:
    normalized = (country_code or "").strip().upper()
    return normalized[:2]


def _default_payload() -> dict:
    return {
        "template": deepcopy(DEFAULT_BADGE_VISUAL_CONFIG),
        "overrides": [],
        "meta": {"version": 1},
    }


class BadgeVisualFileRepository:
    @classmethod
    def _path(cls) -> Path:
        env_path = os.getenv("BADGE_VISUAL_CONFIG_PATH", "").strip()
        if env_path:
            return Path(env_path).expanduser().resolve()
        return Path(__file__).resolve().parent / "data" / _DEFAULT_FILE_NAME

    @classmethod
    def _ensure_file(cls) -> None:
        path = cls._path()
        if path.exists():
            return
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = _default_payload()
        path.write_text(
            json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )

    @classmethod
    def read(cls) -> dict:
        with _FILE_LOCK:
            cls._ensure_file()
            path = cls._path()
            raw = json.loads(path.read_text(encoding="utf-8"))
            template = _merge_dict(_empty_like_default(), raw.get("template") or {})
            overrides = raw.get("overrides") or []
            meta = raw.get("meta") or {"version": 1}
            return {"template": template, "overrides": overrides, "meta": meta}

    @classmethod
    def write(cls, payload: dict) -> dict:
        with _FILE_LOCK:
            cls._ensure_file()
            path = cls._path()
            path.parent.mkdir(parents=True, exist_ok=True)

            normalized = {
                "template": _merge_dict(
                    _empty_like_default(), payload.get("template") or {}
                ),
                "overrides": payload.get("overrides") or [],
                "meta": payload.get("meta") or {"version": 1},
            }
            tmp_path = path.with_suffix(path.suffix + ".tmp")
            tmp_path.write_text(
                json.dumps(normalized, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
            )
            tmp_path.replace(path)
            return normalized

    @classmethod
    def export_json(cls) -> str:
        with _FILE_LOCK:
            cls._ensure_file()
            path = cls._path()
            return path.read_text(encoding="utf-8")


class BadgeVisualService:
    @classmethod
    def read_payload(cls) -> dict:
        return BadgeVisualFileRepository.read()

    @classmethod
    def load_template(cls):
        return cls.read_payload()["template"]

    @classmethod
    def list_overrides(cls) -> list[dict]:
        return cls.read_payload()["overrides"]

    @classmethod
    def save_template(cls, template_config: dict) -> dict:
        payload = cls.read_payload()
        payload["template"] = _merge_dict(_empty_like_default(), template_config or {})
        return BadgeVisualFileRepository.write(payload)

    @classmethod
    def upsert_override(
        cls,
        *,
        badge_code: str | None,
        country_code: str | None,
        config: dict,
    ) -> tuple[dict, dict]:
        normalized_country = _normalize_country_code(country_code)
        normalized_badge_code = (badge_code or "").strip().upper()
        payload = cls.read_payload()
        overrides = payload["overrides"]

        existing = None
        for item in overrides:
            if (
                item.get("badge_code") or ""
            ).strip().upper() == normalized_badge_code and _normalize_country_code(
                item.get("country_code")
            ) == normalized_country:
                existing = item
                break

        if existing is not None:
            existing["config"] = config or {}
            existing["country_code"] = normalized_country
            existing["badge_code"] = normalized_badge_code
            saved = existing
        else:
            next_id = max([int(item.get("id", 0)) for item in overrides] + [0]) + 1
            saved = {
                "id": next_id,
                "badge_code": normalized_badge_code,
                "country_code": normalized_country,
                "config": config or {},
            }
            overrides.append(saved)

        updated = BadgeVisualFileRepository.write(payload)
        return updated, deepcopy(saved)

    @classmethod
    def delete_override(cls, override_id: int) -> bool:
        payload = cls.read_payload()
        overrides = payload["overrides"]
        initial_count = len(overrides)
        payload["overrides"] = [
            item for item in overrides if int(item.get("id", 0)) != int(override_id)
        ]
        if len(payload["overrides"]) == initial_count:
            return False
        BadgeVisualFileRepository.write(payload)
        return True

    @classmethod
    def resolve_config(cls, *, badge=None, country_code=""):
        resolved = cls.load_template()
        normalized_country = _normalize_country_code(country_code)
        badge_code = (getattr(badge, "code", "") or "").strip().upper()
        for item in cls.list_overrides():
            item_badge_code = (item.get("badge_code") or "").strip().upper()
            item_country = _normalize_country_code(item.get("country_code"))
            if item_badge_code or item_country:
                continue
            resolved = _merge_dict(resolved, item.get("config") or {})

        if badge_code:
            for item in cls.list_overrides():
                item_badge_code = (item.get("badge_code") or "").strip().upper()
                item_country = _normalize_country_code(item.get("country_code"))
                if item_badge_code == badge_code and not item_country:
                    resolved = _merge_dict(resolved, item.get("config") or {})

        if badge_code and normalized_country:
            for item in cls.list_overrides():
                item_badge_code = (item.get("badge_code") or "").strip().upper()
                item_country = _normalize_country_code(item.get("country_code"))
                if item_badge_code == badge_code and item_country == normalized_country:
                    resolved = _merge_dict(resolved, item.get("config") or {})

        return resolved
