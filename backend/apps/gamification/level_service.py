import math

INITIAL_REQUIRED_XP = 100
LEVEL_GROWTH_MULTIPLIER = 1.25

LEVEL_TITLES = [
    "Novice",
    "Explorer",
    "Adventurer",
    "Pathfinder",
    "Wanderer",
    "Navigator",
    "Trailblazer",
    "Veteran",
    "Expert",
    "Legend",
]


class LevelService:
    @staticmethod
    def _next_required_xp(required_xp: int) -> int:
        return int(math.ceil(float(required_xp) * LEVEL_GROWTH_MULTIPLIER))

    @classmethod
    def _level_state_from_total_xp(cls, xp: int) -> tuple[int, int, int]:
        safe_xp = max(0, xp)
        level = 1
        xp_for_current_level = 0
        required_delta = INITIAL_REQUIRED_XP
        xp_for_next_level = required_delta

        while safe_xp >= xp_for_next_level:
            level += 1
            xp_for_current_level = xp_for_next_level
            required_delta = cls._next_required_xp(required_delta)
            xp_for_next_level = xp_for_current_level + required_delta

        return level, xp_for_current_level, xp_for_next_level

    @classmethod
    def get_level(cls, xp: int) -> int:
        level, _, _ = cls._level_state_from_total_xp(xp)
        return level

    @classmethod
    def get_level_info(cls, xp: int) -> dict:
        safe_xp = max(0, xp)
        level, current_threshold, next_threshold = cls._level_state_from_total_xp(
            safe_xp
        )
        title_index = min(level - 1, len(LEVEL_TITLES) - 1)
        title = LEVEL_TITLES[title_index]
        xp_in_level = safe_xp - current_threshold
        xp_range = max(1, next_threshold - current_threshold)
        progress_percent = int((xp_in_level / xp_range) * 100)
        return {
            "level": level,
            "title": title,
            "current_xp": safe_xp,
            "xp_for_current_level": current_threshold,
            "xp_for_next_level": next_threshold,
            "xp_progress_percent": progress_percent,
        }
