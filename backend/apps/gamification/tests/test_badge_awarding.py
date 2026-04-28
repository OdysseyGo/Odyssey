from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.gamification.models import UserBadge
from apps.gamification.services import BadgeService
from apps.tours.models import Puzzle, PuzzleAttempt, Tour, TourStep

User = get_user_model()


class BadgeAwardingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="badge_user", password="password")

    def _create_completed_progress(
        self,
        *,
        city,
        country_code,
        skip_count=0,
        failed_attempts=0,
        failed_attempt_puzzle_type=Puzzle.TRIVIA,
    ):
        tour = Tour.objects.create(
            title=f"{city} Tour",
            description="Badge test tour",
            creator=self.user,
            tour_type=Tour.PUZZLE,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=25,
            city=city,
            country_code=country_code,
        )
        step = TourStep.objects.create(
            tour=tour,
            order=0,
            title="Step 1",
            description="Step",
            latitude="1.0",
            longitude="1.0",
        )
        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=failed_attempt_puzzle_type,
            question="Q",
            correct_answer="A",
            options=["A", "B"],
            hint="",
            xp_reward=10,
        )
        progress = self.user.tour_progress.create(
            tour=tour,
            current_step=None,
            status="COMPLETED",
            total_xp=0,
            skip_count=skip_count,
        )
        for _ in range(failed_attempts):
            PuzzleAttempt.objects.create(
                puzzle=puzzle,
                user=self.user,
                progress=progress,
                accepted=False,
            )
        return progress

    def test_awards_city_tier_badge_for_city_completion(self):
        progress = self._create_completed_progress(
            city="Paris",
            country_code="FR",
            skip_count=1,
            failed_attempts=1,
        )

        earned = BadgeService.check_badges(self.user, completed_progress=progress)

        self.assertTrue(any(name == "City Bronze" for name in earned))
        self.assertTrue(
            UserBadge.objects.filter(
                user=self.user,
                badge__code=BadgeService.CITY_BRONZE_CODE,
                city="Paris",
                country_code="FR",
                mistake_count=2,
            ).exists()
        )

    def test_upgrades_city_badge_when_better_tier_is_earned(self):
        bronze_progress = self._create_completed_progress(
            city="Istanbul",
            country_code="TR",
            skip_count=3,
            failed_attempts=2,
        )
        BadgeService.check_badges(self.user, completed_progress=bronze_progress)

        gold_progress = self._create_completed_progress(
            city="Istanbul",
            country_code="TR",
            skip_count=0,
            failed_attempts=0,
        )
        earned = BadgeService.check_badges(self.user, completed_progress=gold_progress)

        self.assertTrue(any(name == "City Gold" for name in earned))
        self.assertEqual(
            UserBadge.objects.filter(
                user=self.user,
                city="Istanbul",
                country_code="TR",
            ).count(),
            1,
        )
        self.assertTrue(
            UserBadge.objects.filter(
                user=self.user,
                city="Istanbul",
                country_code="TR",
                badge__code=BadgeService.CITY_GOLD_CODE,
            ).exists()
        )

    def test_city_badge_does_not_downgrade(self):
        gold_progress = self._create_completed_progress(
            city="Rome",
            country_code="IT",
            skip_count=0,
            failed_attempts=0,
        )
        BadgeService.check_badges(self.user, completed_progress=gold_progress)

        bronze_progress = self._create_completed_progress(
            city="Rome",
            country_code="IT",
            skip_count=4,
            failed_attempts=2,
        )
        earned = BadgeService.check_badges(
            self.user, completed_progress=bronze_progress
        )

        self.assertFalse(any(name == "City Bronze" for name in earned))
        self.assertTrue(
            UserBadge.objects.filter(
                user=self.user,
                city="Rome",
                country_code="IT",
                badge__code=BadgeService.CITY_GOLD_CODE,
            ).exists()
        )

    def test_awards_xp_milestone_badges_once(self):
        self.user.xp = 550
        self.user.save(update_fields=["xp"])

        earned = BadgeService.check_badges(self.user)
        earned_second_pass = BadgeService.check_badges(self.user)

        self.assertIn("XP Explorer I", earned)
        self.assertIn("XP Explorer II", earned)
        self.assertNotIn("XP Explorer III", earned)
        self.assertEqual(earned_second_pass, [])

    def test_ar_picture_failed_attempts_are_reduced_for_badge_penalty(self):
        progress_two_failures = self._create_completed_progress(
            city="Berlin",
            country_code="DE",
            failed_attempts=2,
            failed_attempt_puzzle_type=Puzzle.AR,
        )
        BadgeService.check_badges(self.user, completed_progress=progress_two_failures)
        badge = UserBadge.objects.get(
            user=self.user,
            city="Berlin",
            country_code="DE",
        )
        self.assertEqual(badge.badge.code, BadgeService.CITY_GOLD_CODE)
        self.assertEqual(badge.mistake_count, 0)

        progress_three_failures = self._create_completed_progress(
            city="Madrid",
            country_code="ES",
            failed_attempts=3,
            failed_attempt_puzzle_type=Puzzle.PICTURE_COMPARE,
        )
        BadgeService.check_badges(self.user, completed_progress=progress_three_failures)
        badge = UserBadge.objects.get(
            user=self.user,
            city="Madrid",
            country_code="ES",
        )
        self.assertEqual(badge.badge.code, BadgeService.CITY_SILVER_CODE)
        self.assertEqual(badge.mistake_count, 1)

        progress_six_failures = self._create_completed_progress(
            city="Lisbon",
            country_code="PT",
            failed_attempts=6,
            failed_attempt_puzzle_type=Puzzle.AR,
        )
        BadgeService.check_badges(self.user, completed_progress=progress_six_failures)
        badge = UserBadge.objects.get(
            user=self.user,
            city="Lisbon",
            country_code="PT",
        )
        self.assertEqual(badge.badge.code, BadgeService.CITY_BRONZE_CODE)
        self.assertEqual(badge.mistake_count, 2)
