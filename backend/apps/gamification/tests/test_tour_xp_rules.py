from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework import status
from rest_framework.test import APITestCase

from apps.ads.models import RewardedAdGrant
from apps.gamification.models import TourProgress, UserBadge
from apps.gamification.services import BadgeService
from apps.tours.models import (
    ArPuzzleDetail,
    CompassPuzzleDetail,
    Puzzle,
    PuzzleAttempt,
    Tour,
    TourStep,
)

User = get_user_model()


class TourXpRulesTests(APITestCase):
    def setUp(self):
        self.player = User.objects.create_user(username="xp_user", password="password")
        self.creator = User.objects.create_user(
            username="tour_creator", password="password"
        )
        self.client.force_authenticate(user=self.player)

    def _create_tour_with_single_step(
        self,
        *,
        title="XP Tour",
        tour_type=Tour.PUZZLE,
        walking_distance_m=0.0,
        generation_source=Tour.USER,
    ):
        tour = Tour.objects.create(
            title=title,
            description="XP test tour",
            creator=self.creator,
            tour_type=tour_type,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=10,
            city="Istanbul",
            country_code="TR",
            walking_distance=walking_distance_m,
            generation_source=generation_source,
        )
        step = TourStep.objects.create(
            tour=tour,
            order=0,
            title="Step 1",
            description="",
            latitude="1.0",
            longitude="1.0",
        )
        return tour, step

    def test_story_tour_each_completed_step_awards_25_xp(self):
        tour, first_step = self._create_tour_with_single_step(
            title="Story XP Tour",
            tour_type=Tour.STORY,
        )
        TourStep.objects.create(
            tour=tour,
            order=1,
            title="Step 2",
            description="",
            latitude="1.1",
            longitude="1.1",
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        progress_id = create_response.data["id"]
        self.assertEqual(create_response.data["current_step"]["id"], first_step.id)

        first_complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(first_complete_response.status_code, status.HTTP_200_OK)
        self.assertFalse(first_complete_response.data["is_tour_complete"])

        progress = TourProgress.objects.get(id=progress_id)
        self.assertEqual(progress.total_xp, 25)

        second_complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(second_complete_response.status_code, status.HTTP_200_OK)
        self.assertTrue(second_complete_response.data["is_tour_complete"])
        self.assertEqual(second_complete_response.data["awarded_xp"], 50)

        progress.refresh_from_db()
        self.player.refresh_from_db()
        self.assertEqual(progress.total_xp, 50)
        self.assertEqual(self.player.xp, 50)

    def test_completion_adds_tour_walking_distance_to_user_total_km(self):
        tour, _ = self._create_tour_with_single_step(
            title="KM Tour",
            walking_distance_m=3250,
        )
        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)

        self.player.refresh_from_db()
        self.assertEqual(self.player.total_walked_km, Decimal("3.250"))

    def test_own_manual_tour_completion_does_not_add_km_even_without_xp(self):
        self.creator = self.player
        tour, _ = self._create_tour_with_single_step(
            title="Own KM Tour",
            walking_distance_m=1800,
        )
        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 0)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 0)
        self.assertEqual(self.player.total_walked_km, Decimal("0.000"))

    def test_own_ai_tour_completion_adds_km_and_xp(self):
        self.creator = self.player
        tour, _ = self._create_tour_with_single_step(
            title="Own AI KM Tour",
            walking_distance_m=1800,
            generation_source=Tour.AI,
        )
        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 25)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 25)
        self.assertEqual(self.player.total_walked_km, Decimal("1.800"))

    def test_replay_completion_adds_km_again(self):
        tour, _ = self._create_tour_with_single_step(
            title="Replay KM Tour",
            walking_distance_m=2000,
        )
        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        first_complete = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(first_complete.status_code, status.HTTP_200_OK)

        replay_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        self.assertEqual(replay_response.status_code, status.HTTP_200_OK)
        replay_progress_id = replay_response.data["id"]

        second_complete = self.client.post(
            f"/api/tour-progress/{replay_progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(second_complete.status_code, status.HTTP_200_OK)

        self.player.refresh_from_db()
        self.assertEqual(self.player.total_walked_km, Decimal("4.000"))

    def test_skipped_step_gives_no_xp(self):
        tour, _ = self._create_tour_with_single_step(title="Skip Tour")
        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        progress_id = create_response.data["id"]
        skip_response = self.client.post(
            f"/api/tour-progress/{progress_id}/skip-step/", format="json"
        )
        self.assertEqual(skip_response.status_code, status.HTTP_200_OK)

        self.player.refresh_from_db()
        progress = TourProgress.objects.get(id=progress_id)
        self.assertEqual(progress.total_xp, 0)
        self.assertEqual(self.player.xp, 0)

    def test_non_review_use_ad_skip_requires_hint_grant(self):
        tour, _ = self._create_tour_with_single_step(title="Ad Skip Requires Grant")
        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        progress_id = create_response.data["id"]
        skip_response = self.client.post(
            f"/api/tour-progress/{progress_id}/skip-step/",
            {"use_ad_skip": True},
            format="json",
        )
        self.assertEqual(skip_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No unconsumed HINT", skip_response.data["error"])

    def test_review_account_use_ad_skip_bypasses_hint_grant_but_still_counts_skip(self):
        self.player.is_review_account = True
        self.player.save(update_fields=["is_review_account"])
        tour, _ = self._create_tour_with_single_step(title="Review Ad Skip Bypass")
        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        progress_id = create_response.data["id"]
        skip_response = self.client.post(
            f"/api/tour-progress/{progress_id}/skip-step/",
            {"use_ad_skip": True},
            format="json",
        )
        self.assertEqual(skip_response.status_code, status.HTTP_200_OK)
        self.assertEqual(RewardedAdGrant.objects.count(), 0)

        progress = TourProgress.objects.get(id=progress_id)
        self.assertEqual(progress.skip_count, 1)

    def test_up_to_two_wrong_ar_attempts_then_correct_keeps_step_xp(self):
        tour, step = self._create_tour_with_single_step(title="Wrong Attempt Tour")
        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.AR,
            question="Find code",
            correct_answer="",
            hint="",
            xp_reward=25,
        )
        ArPuzzleDetail.objects.create(
            puzzle=puzzle,
            scene_asset_url="https://example.com/model.glb",
            metadata={
                "model_id": 1,
                "anchor_id": "head",
                "placement_mode": "anchor",
                "secret_code": "CODE77",
                "model_scale_meters": 1.0,
                "anchor_position": {"x": 0.0, "y": 1.0, "z": -1.0},
            },
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        wrong_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-ar-code/",
            {"code": "WRONG"},
            format="json",
        )
        self.assertEqual(wrong_response.status_code, status.HTTP_200_OK)
        self.assertFalse(wrong_response.data["accepted"])

        correct_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-ar-code/",
            {"code": "CODE77"},
            format="json",
        )
        self.assertEqual(correct_response.status_code, status.HTTP_200_OK)
        self.assertTrue(correct_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)

        progress = TourProgress.objects.get(id=progress_id)
        self.player.refresh_from_db()
        self.assertEqual(progress.total_xp, 50)
        self.assertEqual(self.player.xp, 50)

    def test_three_wrong_ar_attempts_then_correct_gives_zero_step_xp(self):
        tour, step = self._create_tour_with_single_step(
            title="Three Wrong AR Attempts Tour"
        )
        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.AR,
            question="Find code",
            correct_answer="",
            hint="",
            xp_reward=50,
        )
        ArPuzzleDetail.objects.create(
            puzzle=puzzle,
            scene_asset_url="https://example.com/model.glb",
            metadata={
                "model_id": 1,
                "anchor_id": "head",
                "placement_mode": "anchor",
                "secret_code": "CODE77",
                "model_scale_meters": 1.0,
                "anchor_position": {"x": 0.0, "y": 1.0, "z": -1.0},
            },
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        for _ in range(3):
            wrong_response = self.client.post(
                f"/api/tour-progress/{progress_id}/submit-ar-code/",
                {"code": "WRONG"},
                format="json",
            )
            self.assertEqual(wrong_response.status_code, status.HTTP_200_OK)
            self.assertFalse(wrong_response.data["accepted"])

        correct_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-ar-code/",
            {"code": "CODE77"},
            format="json",
        )
        self.assertEqual(correct_response.status_code, status.HTTP_200_OK)
        self.assertTrue(correct_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)

        progress = TourProgress.objects.get(id=progress_id)
        self.player.refresh_from_db()
        self.assertEqual(progress.total_xp, 0)
        self.assertEqual(self.player.xp, 0)

    def test_three_wrong_picture_compare_attempts_then_accept_gives_zero_step_xp(self):
        tour, step = self._create_tour_with_single_step(
            title="Three Wrong Picture Attempts Tour"
        )
        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.PICTURE_COMPARE,
            question="Match this image",
            correct_answer="",
            hint="",
            xp_reward=50,
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]
        progress = TourProgress.objects.get(id=progress_id)

        for _ in range(3):
            PuzzleAttempt.objects.create(
                puzzle=puzzle,
                user=self.player,
                progress=progress,
                accepted=False,
            )
        PuzzleAttempt.objects.create(
            puzzle=puzzle,
            user=self.player,
            progress=progress,
            accepted=True,
        )

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)

        progress.refresh_from_db()
        self.player.refresh_from_db()
        self.assertEqual(progress.total_xp, 0)
        self.assertEqual(self.player.xp, 0)

    def test_wrong_trivia_prevents_resubmission_and_gives_zero_step_xp(self):
        tour, step = self._create_tour_with_single_step(
            title="Wrong Trivia Attempt Tour"
        )
        Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.TRIVIA,
            question="Capital of Turkey?",
            correct_answer="Ankara",
            options=["Istanbul", "Ankara"],
            hint="",
            xp_reward=25,
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        wrong_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-trivia-answer/",
            {"answer": "Istanbul"},
            format="json",
        )
        self.assertEqual(wrong_response.status_code, status.HTTP_200_OK)
        self.assertFalse(wrong_response.data["accepted"])

        correct_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-trivia-answer/",
            {"answer": "Ankara"},
            format="json",
        )
        self.assertEqual(correct_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(correct_response.data["accepted"])

        skip_response = self.client.post(
            f"/api/tour-progress/{progress_id}/skip-step/",
            format="json",
        )
        self.assertEqual(skip_response.status_code, status.HTTP_200_OK)
        self.assertTrue(skip_response.data["is_tour_complete"])
        self.assertEqual(skip_response.data["awarded_xp"], 0)

        progress = TourProgress.objects.get(id=progress_id)
        self.player.refresh_from_db()
        self.assertEqual(progress.total_xp, 0)
        self.assertEqual(self.player.xp, 0)

    def test_trivia_correct_completion_awards_25_xp(self):
        tour, step = self._create_tour_with_single_step(title="Trivia XP Tour")
        Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.TRIVIA,
            question="Capital of Turkey?",
            correct_answer="Ankara",
            options=["Istanbul", "Ankara"],
            hint="",
            xp_reward=25,
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        answer_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-trivia-answer/",
            {"answer": "Ankara"},
            format="json",
        )
        self.assertEqual(answer_response.status_code, status.HTTP_200_OK)
        self.assertTrue(answer_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 25)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 25)

    def test_non_trivia_correct_completion_awards_50_xp(self):
        tour, step = self._create_tour_with_single_step(title="AR XP Tour")
        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.AR,
            question="Find code",
            correct_answer="",
            hint="",
            xp_reward=50,
        )
        ArPuzzleDetail.objects.create(
            puzzle=puzzle,
            scene_asset_url="https://example.com/model.glb",
            metadata={
                "model_id": 1,
                "anchor_id": "head",
                "placement_mode": "anchor",
                "secret_code": "CODE77",
                "model_scale_meters": 1.0,
                "anchor_position": {"x": 0.0, "y": 1.0, "z": -1.0},
            },
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        answer_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-ar-code/",
            {"code": "CODE77"},
            format="json",
        )
        self.assertEqual(answer_response.status_code, status.HTTP_200_OK)
        self.assertTrue(answer_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 50)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 50)

    def test_compass_completion_awards_50_xp_without_submission_endpoint(self):
        tour, step = self._create_tour_with_single_step(title="Compass XP Tour")
        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.COMPASS,
            question="Find north-east",
            correct_answer="",
            hint="",
            xp_reward=50,
        )
        CompassPuzzleDetail.objects.create(
            puzzle=puzzle,
            target_heading_degrees=45.0,
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 50)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 50)

    def test_completed_tour_does_not_award_xp_twice(self):
        tour, _ = self._create_tour_with_single_step(title="Replay Tour")

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        first_progress_id = create_response.data["id"]
        first_complete = self.client.post(
            f"/api/tour-progress/{first_progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(first_complete.status_code, status.HTTP_200_OK)
        self.assertEqual(first_complete.data["awarded_xp"], 25)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 25)
        self.assertEqual(self.player.tour_count, 1)

        replay_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        self.assertEqual(replay_response.status_code, status.HTTP_200_OK)
        replay_progress_id = replay_response.data["id"]

        second_complete = self.client.post(
            f"/api/tour-progress/{replay_progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(second_complete.status_code, status.HTTP_200_OK)
        self.assertEqual(second_complete.data["awarded_xp"], 0)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 25)
        self.assertEqual(self.player.tour_count, 1)

        progress = TourProgress.objects.get(id=replay_progress_id)
        self.assertTrue(progress.xp_awarded)

    def test_replay_of_legacy_completed_progress_does_not_award_xp(self):
        tour, step = self._create_tour_with_single_step(title="Legacy Replay Tour")
        legacy_progress = TourProgress.objects.create(
            user=self.player,
            tour=tour,
            current_step=None,
            status=TourProgress.COMPLETED,
            total_xp=25,
            xp_awarded=False,
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        self.assertEqual(create_response.status_code, status.HTTP_200_OK)
        self.assertEqual(create_response.data["id"], legacy_progress.id)

        complete_response = self.client.post(
            f"/api/tour-progress/{legacy_progress.id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 0)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 0)

    def test_first_level_up_at_100_from_tour_completion(self):
        tour, _ = self._create_tour_with_single_step(title="Level Up Tour")
        self.player.xp = 75
        self.player.level = 1
        self.player.save(update_fields=["xp", "level"])

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]
        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 100)
        self.assertEqual(self.player.level, 2)

    def test_unique_user_tour_progress_prevents_duplicates(self):
        tour, step = self._create_tour_with_single_step(title="Unique Progress Tour")
        TourProgress.objects.create(
            user=self.player,
            tour=tour,
            current_step=step,
            status=TourProgress.IN_PROGRESS,
        )

        with self.assertRaises(IntegrityError):
            TourProgress.objects.create(
                user=self.player,
                tour=tour,
                current_step=step,
                status=TourProgress.IN_PROGRESS,
            )

    def test_own_tour_completion_does_not_award_xp_or_badges(self):
        self.creator = self.player
        tour, step = self._create_tour_with_single_step(title="Own Tour")
        Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.TRIVIA,
            question="Capital of Turkey?",
            correct_answer="Ankara",
            options=["Istanbul", "Ankara"],
            hint="",
            xp_reward=25,
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        answer_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-trivia-answer/",
            {"answer": "Ankara"},
            format="json",
        )
        self.assertEqual(answer_response.status_code, status.HTTP_200_OK)
        self.assertTrue(answer_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 0)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 0)
        self.assertEqual(self.player.tour_count, 0)
        self.assertEqual(self.player.level, 1)
        self.assertFalse(
            UserBadge.objects.filter(
                user=self.player,
                badge__code__in=(
                    BadgeService.CITY_BRONZE_CODE,
                    BadgeService.CITY_SILVER_CODE,
                    BadgeService.CITY_GOLD_CODE,
                    BadgeService.XP_100_CODE,
                    BadgeService.XP_500_CODE,
                    BadgeService.XP_1000_CODE,
                ),
            ).exists()
        )

    def test_own_ai_tour_completion_awards_xp_and_badges(self):
        self.creator = self.player
        tour, step = self._create_tour_with_single_step(
            title="Own AI Tour",
            generation_source=Tour.AI,
        )
        Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.TRIVIA,
            question="Capital of Turkey?",
            correct_answer="Ankara",
            options=["Istanbul", "Ankara"],
            hint="",
            xp_reward=25,
        )

        create_response = self.client.post(
            "/api/tour-progress/", {"tour_id": tour.id}, format="json"
        )
        progress_id = create_response.data["id"]

        answer_response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-trivia-answer/",
            {"answer": "Ankara"},
            format="json",
        )
        self.assertEqual(answer_response.status_code, status.HTTP_200_OK)
        self.assertTrue(answer_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["awarded_xp"], 25)

        self.player.refresh_from_db()
        self.assertEqual(self.player.xp, 25)
        self.assertEqual(self.player.tour_count, 1)
        self.assertTrue(
            UserBadge.objects.filter(
                user=self.player,
                badge__code=BadgeService.CITY_GOLD_CODE,
                city="Istanbul",
                country_code="TR",
            ).exists()
        )
