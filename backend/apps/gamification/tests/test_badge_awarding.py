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
            puzzle_type=Puzzle.TRIVIA,
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

    def test_awards_city_tier_badge_for_first_city_completion(self):
        progress = self._create_completed_progress(
            city="Paris",
            country_code="FR",
            skip_count=1,
            failed_attempts=1,
        )

        earned = BadgeService.check_badges(self.user, completed_progress=progress)

        self.assertTrue(any(name == "City Silver" for name in earned))
        self.assertTrue(
            UserBadge.objects.filter(
                user=self.user,
                badge__code=BadgeService.CITY_SILVER_CODE,
                city="Paris",
                country_code="FR",
                mistake_count=2,
            ).exists()
        )

    def test_does_not_award_same_city_tier_twice(self):
        first_progress = self._create_completed_progress(
            city="Istanbul",
            country_code="TR",
            skip_count=0,
            failed_attempts=0,
        )
        BadgeService.check_badges(self.user, completed_progress=first_progress)

        second_progress = self._create_completed_progress(
            city="Istanbul",
            country_code="TR",
            skip_count=3,
            failed_attempts=2,
        )
        earned = BadgeService.check_badges(
            self.user, completed_progress=second_progress
        )

        self.assertFalse(any(name.startswith("City ") for name in earned))
        self.assertEqual(
            UserBadge.objects.filter(
                user=self.user,
                city="Istanbul",
                country_code="TR",
            ).count(),
            1,
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
