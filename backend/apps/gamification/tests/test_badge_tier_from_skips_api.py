from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import UserBadge
from apps.gamification.services import BadgeService
from apps.tours.models import Puzzle, Tour, TourStep, TriviaPuzzleDetail

User = get_user_model()


class BadgeTierFromSkipsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="skip_badge_user", password="password"
        )
        self.creator = User.objects.create_user(
            username="skip_badge_creator", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Skip Badge Tour",
            description="Badge tier test",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=15,
            city="Ankara",
            country_code="TR",
        )
        for i in range(3):
            TourStep.objects.create(
                tour=self.tour,
                order=i,
                title=f"Step {i + 1}",
                description="",
                latitude=str(39.9 + i * 0.001),
                longitude=str(32.8 + i * 0.001),
            )

    def test_all_skipped_steps_award_no_city_badge(self):
        create_response = self.client.post(
            "/api/tour-progress/",
            {"tour_id": self.tour.id},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        progress_id = create_response.data["id"]

        for _ in range(3):
            skip_response = self.client.post(
                f"/api/tour-progress/{progress_id}/skip-step/",
                format="json",
            )
            self.assertEqual(skip_response.status_code, status.HTTP_200_OK)

        badge = UserBadge.objects.filter(
            user=self.user,
            city="Ankara",
            country_code="TR",
        ).first()

        self.assertIsNone(badge)


class BadgeTierFromTriviaApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="trivia_badge_user", password="password"
        )
        self.creator = User.objects.create_user(
            username="trivia_badge_creator", password="password"
        )
        self.client.force_authenticate(user=self.user)

    def _create_two_trivia_tour(self, *, city="Izmir", country_code="TR"):
        tour = Tour.objects.create(
            title=f"{city} Trivia Tour",
            description="Trivia badge tier test",
            creator=self.creator,
            tour_type=Tour.PUZZLE,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=15,
            city=city,
            country_code=country_code,
        )
        for i in range(2):
            step = TourStep.objects.create(
                tour=tour,
                order=i,
                title=f"Question {i + 1}",
                description="",
                latitude=str(38.4 + i * 0.001),
                longitude=str(27.1 + i * 0.001),
            )
            puzzle = Puzzle.objects.create(
                step=step,
                puzzle_type=Puzzle.TRIVIA,
                question="Correct option?",
                options=["A", "B"],
                correct_answer="A",
                hint="",
                xp_reward=25,
            )
            TriviaPuzzleDetail.objects.create(
                puzzle=puzzle,
                options=["A", "B"],
                correct_answer="A",
            )
        return tour

    def _start_tour(self, tour):
        response = self.client.post(
            "/api/tour-progress/",
            {"tour_id": tour.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data["id"]

    def _answer_current_trivia(self, progress_id, answer):
        response = self.client.post(
            f"/api/tour-progress/{progress_id}/submit-trivia-answer/",
            {"answer": answer},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response

    def _skip_current_step(self, progress_id):
        response = self.client.post(
            f"/api/tour-progress/{progress_id}/skip-step/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response

    def _complete_current_step(self, progress_id):
        response = self.client.post(
            f"/api/tour-progress/{progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response

    def test_two_wrong_trivia_answers_award_bronze(self):
        tour = self._create_two_trivia_tour()
        progress_id = self._start_tour(tour)

        self._answer_current_trivia(progress_id, "B")
        self._skip_current_step(progress_id)
        self._answer_current_trivia(progress_id, "B")
        self._skip_current_step(progress_id)

        badge = UserBadge.objects.get(
            user=self.user,
            city="Izmir",
            country_code="TR",
        )
        self.assertEqual(badge.badge.code, BadgeService.CITY_BRONZE_CODE)
        self.assertEqual(badge.mistake_count, 2)

    def test_one_wrong_trivia_answer_awards_silver(self):
        tour = self._create_two_trivia_tour(city="Bursa")
        progress_id = self._start_tour(tour)

        self._answer_current_trivia(progress_id, "B")
        self._skip_current_step(progress_id)
        self._answer_current_trivia(progress_id, "A")
        self._complete_current_step(progress_id)

        badge = UserBadge.objects.get(
            user=self.user,
            city="Bursa",
            country_code="TR",
        )
        self.assertEqual(badge.badge.code, BadgeService.CITY_SILVER_CODE)
        self.assertEqual(badge.mistake_count, 1)
