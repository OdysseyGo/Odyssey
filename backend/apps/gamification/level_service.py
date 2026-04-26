LEVEL_THRESHOLDS = [0, 200, 400, 700, 1000, 1400, 1800, 2300, 2800, 3500]
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
    def get_level(xp: int) -> int:
        level = 1
        for i, threshold in enumerate(LEVEL_THRESHOLDS):
            if xp >= threshold:
                level = i + 1
        return level

    @staticmethod
    def get_level_info(xp: int) -> dict:
        level = LevelService.get_level(xp)
        title = LEVEL_TITLES[level - 1]
        current_threshold = LEVEL_THRESHOLDS[level - 1]
        if level < len(LEVEL_THRESHOLDS):
            next_threshold = LEVEL_THRESHOLDS[level]
            xp_in_level = xp - current_threshold
            xp_range = next_threshold - current_threshold
            progress_percent = int((xp_in_level / xp_range) * 100)
        else:
            next_threshold = current_threshold
            progress_percent = 100
        return {
            "level": level,
            "title": title,
            "current_xp": xp,
            "xp_for_current_level": current_threshold,
            "xp_for_next_level": next_threshold,
            "xp_progress_percent": progress_percent,
        }
