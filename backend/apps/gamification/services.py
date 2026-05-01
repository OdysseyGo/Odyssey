from decimal import Decimal

from apps.tours.models import Puzzle, PuzzleAttempt

from .level_service import LevelService
from .models import Badge, UserBadge, UserBadgeHistory


class BadgeService:
    CITY_GOLD_CODE = "CITY_GOLD"
    CITY_SILVER_CODE = "CITY_SILVER"
    CITY_BRONZE_CODE = "CITY_BRONZE"

    XP_100_CODE = "XP_100"
    XP_500_CODE = "XP_500"
    XP_1000_CODE = "XP_1000"

    XP_MILESTONES = (
        (100, XP_100_CODE, "XP Explorer I"),
        (500, XP_500_CODE, "XP Explorer II"),
        (1000, XP_1000_CODE, "XP Explorer III"),
    )
    CITY_TIER_RANK = {
        CITY_BRONZE_CODE: 1,
        CITY_SILVER_CODE: 2,
        CITY_GOLD_CODE: 3,
    }

    @staticmethod
    def _ensure_badge(code, *, name, description, criteria):
        badge, _ = Badge.objects.get_or_create(
            code=code,
            defaults={
                "name": name,
                "description": description,
                "criteria": criteria,
            },
        )
        return badge

    @classmethod
    def ensure_default_badges(cls):
        cls._ensure_badge(
            cls.CITY_GOLD_CODE,
            name="City Gold",
            description="Completed your first tour in a city with zero mistakes.",
            criteria={"kind": "city_first_completion", "tier": "gold"},
        )
        cls._ensure_badge(
            cls.CITY_SILVER_CODE,
            name="City Silver",
            description="Completed your first tour in a city with one mistake.",
            criteria={"kind": "city_first_completion", "tier": "silver"},
        )
        cls._ensure_badge(
            cls.CITY_BRONZE_CODE,
            name="City Bronze",
            description="Completed your first tour in a city with two mistakes.",
            criteria={"kind": "city_first_completion", "tier": "bronze"},
        )
        for xp_threshold, code, name in cls.XP_MILESTONES:
            cls._ensure_badge(
                code,
                name=name,
                description=f"Earned at least {xp_threshold} XP.",
                criteria={"kind": "xp_milestone", "xp": xp_threshold},
            )

    @staticmethod
    def _city_badge_code_from_mistakes(mistake_count):
        if mistake_count == 0:
            return BadgeService.CITY_GOLD_CODE
        if mistake_count == 1:
            return BadgeService.CITY_SILVER_CODE
        if mistake_count == 2:
            return BadgeService.CITY_BRONZE_CODE
        return None

    @staticmethod
    def _record_badge_history(
        *,
        user,
        badge,
        user_badge=None,
        source_tour=None,
        city="",
        country_code="ZZ",
        mistake_count=None,
        event_type=UserBadgeHistory.EARNED,
    ):
        UserBadgeHistory.objects.create(
            user=user,
            badge=badge,
            user_badge=user_badge,
            source_tour=source_tour,
            city=city,
            country_code=country_code,
            mistake_count=mistake_count,
            event_type=event_type,
        )

    @staticmethod
    def _award_or_upgrade_city_badge(user, completed_progress):
        tour = completed_progress.tour
        city = (tour.city or "Unknown City").strip() or "Unknown City"
        country_code = (tour.country_code or "ZZ").strip().upper() or "ZZ"
        country_code = country_code[:2]

        mistake_count = TourRewardService.city_badge_mistake_count(
            user=user,
            progress=completed_progress,
        )
        city_badges = list(
            UserBadge.objects.select_related("badge").filter(
                user=user,
                city=city,
                country_code=country_code,
                badge__code__in=(
                    BadgeService.CITY_BRONZE_CODE,
                    BadgeService.CITY_SILVER_CODE,
                    BadgeService.CITY_GOLD_CODE,
                ),
            )
        )

        best_existing = None
        best_existing_rank = -1
        for city_badge in city_badges:
            city_badge_rank = BadgeService.CITY_TIER_RANK.get(
                city_badge.badge.code or "", 0
            )
            if city_badge_rank > best_existing_rank:
                best_existing = city_badge
                best_existing_rank = city_badge_rank

        for duplicate in city_badges:
            if best_existing is not None and duplicate.id != best_existing.id:
                duplicate.delete()

        badge_code = BadgeService._city_badge_code_from_mistakes(mistake_count)
        if not badge_code:
            return []
        badge = Badge.objects.filter(code=badge_code).first()
        if badge is None:
            return []

        if best_existing is None:
            user_badge = UserBadge.objects.create(
                user=user,
                badge=badge,
                city=city,
                country_code=country_code,
                mistake_count=mistake_count,
                source_tour=tour,
            )
            BadgeService._record_badge_history(
                user=user,
                badge=badge,
                user_badge=user_badge,
                source_tour=tour,
                city=city,
                country_code=country_code,
                mistake_count=mistake_count,
            )
            return [badge.name]

        existing_rank = BadgeService.CITY_TIER_RANK.get(
            best_existing.badge.code or "", 0
        )
        candidate_rank = BadgeService.CITY_TIER_RANK.get(badge_code, 0)

        if candidate_rank > existing_rank:
            best_existing.badge = badge
            best_existing.mistake_count = mistake_count
            best_existing.source_tour = tour
            best_existing.save(update_fields=["badge", "mistake_count", "source_tour"])
            BadgeService._record_badge_history(
                user=user,
                badge=badge,
                user_badge=best_existing,
                source_tour=tour,
                city=city,
                country_code=country_code,
                mistake_count=mistake_count,
                event_type=UserBadgeHistory.UPGRADED,
            )
            return [badge.name]

        # Keep the original earning or upgrade context for the current badge.
        return []

    @staticmethod
    def _award_xp_milestone_badges(user, completed_progress=None):
        newly_earned = []
        for xp_threshold, badge_code, _ in BadgeService.XP_MILESTONES:
            if user.xp < xp_threshold:
                continue

            badge = Badge.objects.filter(code=badge_code).first()
            if badge is None:
                continue

            user_badge, created = UserBadge.objects.get_or_create(
                user=user,
                badge=badge,
                city="",
                country_code="ZZ",
                defaults={
                    "source_tour": (
                        completed_progress.tour
                        if completed_progress is not None
                        else None
                    ),
                },
            )
            if created:
                BadgeService._record_badge_history(
                    user=user,
                    badge=badge,
                    user_badge=user_badge,
                    source_tour=(
                        completed_progress.tour
                        if completed_progress is not None
                        else None
                    ),
                )
                newly_earned.append(badge.name)
        return newly_earned

    @staticmethod
    def check_badges(user, completed_progress=None):
        """
        Checks all badges against the user's stats and awards them if criteria are met.
        """
        BadgeService.ensure_default_badges()
        newly_earned = []
        if completed_progress is not None:
            newly_earned.extend(
                BadgeService._award_or_upgrade_city_badge(user, completed_progress)
            )
        newly_earned.extend(
            BadgeService._award_xp_milestone_badges(user, completed_progress)
        )
        return newly_earned


class TourRewardService:
    AR_PICTURE_FAILURE_WINDOW = 3
    PUZZLE_REWARD_RULES = {
        Puzzle.TRIVIA: {
            "xp": Puzzle.TRIVIA_XP_REWARD,
            "requires_submission": True,
            "max_failed_attempts": 0,
        },
        Puzzle.AR: {
            "xp": Puzzle.NON_TRIVIA_XP_REWARD,
            "requires_submission": True,
            "max_failed_attempts": AR_PICTURE_FAILURE_WINDOW - 1,
        },
        Puzzle.PICTURE_COMPARE: {
            "xp": Puzzle.NON_TRIVIA_XP_REWARD,
            "requires_submission": True,
            "max_failed_attempts": AR_PICTURE_FAILURE_WINDOW - 1,
        },
        Puzzle.COMPASS: {
            "xp": Puzzle.NON_TRIVIA_XP_REWARD,
            "requires_submission": False,
            "max_failed_attempts": 0,
        },
    }

    @classmethod
    def _puzzle_rule(cls, puzzle_type):
        return cls.PUZZLE_REWARD_RULES.get(
            puzzle_type,
            {
                "xp": Puzzle.NON_TRIVIA_XP_REWARD,
                "requires_submission": False,
                "max_failed_attempts": 0,
            },
        )

    @classmethod
    def city_badge_mistake_count(cls, *, user, progress) -> int:
        failed_attempts = PuzzleAttempt.objects.filter(
            user=user,
            progress=progress,
            accepted=False,
        )
        ar_picture_failed_attempts = failed_attempts.filter(
            puzzle__puzzle_type__in=(Puzzle.AR, Puzzle.PICTURE_COMPARE)
        ).count()
        other_failed_attempts = failed_attempts.exclude(
            puzzle__puzzle_type__in=(Puzzle.AR, Puzzle.PICTURE_COMPARE)
        ).count()
        ar_picture_badge_penalty = (
            ar_picture_failed_attempts // cls.AR_PICTURE_FAILURE_WINDOW
        )
        return progress.skip_count + other_failed_attempts + ar_picture_badge_penalty

    @classmethod
    def requires_submission_before_completion(cls, *, progress, user):
        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return None

        puzzle = current_step.puzzle
        puzzle_rule = cls._puzzle_rule(puzzle.puzzle_type)
        if not puzzle_rule["requires_submission"]:
            return None

        has_accepted_attempt = PuzzleAttempt.objects.filter(
            user=user,
            progress=progress,
            puzzle=puzzle,
            accepted=True,
        ).exists()
        if has_accepted_attempt:
            return None
        return puzzle.puzzle_type

    @classmethod
    def skip_counts_as_badge_mistake(cls, *, progress) -> bool:
        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return True

        puzzle = current_step.puzzle
        failed_count = PuzzleAttempt.objects.filter(
            user=progress.user,
            progress=progress,
            puzzle=puzzle,
            accepted=False,
        ).count()
        if failed_count == 0:
            return True

        if puzzle.puzzle_type in (Puzzle.AR, Puzzle.PICTURE_COMPARE):
            return failed_count < cls.AR_PICTURE_FAILURE_WINDOW

        return False

    @staticmethod
    def step_xp_for_completion(*, progress, user) -> int:
        current_step = progress.current_step
        if current_step is None:
            return 0

        if progress.tour.tour_type == progress.tour.STORY:
            return Puzzle.TRIVIA_XP_REWARD

        puzzle = getattr(current_step, "puzzle", None)
        if puzzle is None:
            return Puzzle.TRIVIA_XP_REWARD

        failed_attempt_count = PuzzleAttempt.objects.filter(
            user=user,
            progress=progress,
            puzzle=puzzle,
            accepted=False,
        ).count()

        puzzle_rule = TourRewardService._puzzle_rule(puzzle.puzzle_type)
        if failed_attempt_count > puzzle_rule["max_failed_attempts"]:
            return 0

        return puzzle_rule["xp"]

    @staticmethod
    def apply_tour_completion_rewards(*, progress, user) -> int:
        completed_km = Decimal(str(progress.tour.walking_distance or 0.0)) / Decimal(
            "1000"
        )
        is_own_ai_tour = progress.tour.generation_source == progress.tour.AI
        km_eligible = progress.tour.creator_id != user.id or (
            progress.tour.creator_id == user.id and is_own_ai_tour
        )
        if km_eligible:
            user.total_walked_km += completed_km

        reward_eligible = progress.tour.creator_id != user.id or (
            progress.tour.creator_id == user.id and is_own_ai_tour
        )
        should_apply_reward = not progress.xp_awarded and reward_eligible
        awarded_xp = 0

        if not progress.xp_awarded:
            if reward_eligible:
                user.xp += progress.total_xp
                user.level = LevelService.get_level(user.xp)
                user.tour_count += 1
            progress.xp_awarded = True
            progress.save(update_fields=["xp_awarded"])
            if reward_eligible:
                BadgeService.check_badges(user, completed_progress=progress)
                awarded_xp = progress.total_xp

        user_update_fields = []
        if km_eligible:
            user_update_fields.append("total_walked_km")
        if should_apply_reward:
            user_update_fields.extend(["xp", "level", "tour_count"])
        if user_update_fields:
            user.save(update_fields=user_update_fields)
        return awarded_xp
