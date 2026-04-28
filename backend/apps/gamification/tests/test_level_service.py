from django.test import TestCase

from apps.gamification.level_service import LevelService


class LevelServiceTests(TestCase):
    def test_first_level_up_happens_at_500_xp(self):
        self.assertEqual(LevelService.get_level(499), 1)
        self.assertEqual(LevelService.get_level(500), 2)

    def test_required_xp_grows_by_1_25_with_ceil(self):
        level_two_info = LevelService.get_level_info(500)
        self.assertEqual(level_two_info["xp_for_current_level"], 500)
        self.assertEqual(level_two_info["xp_for_next_level"], 1125)

        level_three_info = LevelService.get_level_info(1125)
        self.assertEqual(level_three_info["xp_for_current_level"], 1125)
        self.assertEqual(level_three_info["xp_for_next_level"], 1907)

    def test_large_xp_crosses_multiple_levels(self):
        info = LevelService.get_level_info(5000)
        self.assertEqual(info["level"], 6)
        self.assertEqual(info["xp_for_current_level"], 4108)
        self.assertEqual(info["xp_for_next_level"], 5637)
