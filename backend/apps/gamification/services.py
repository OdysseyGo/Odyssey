from decimal import Decimal

from django.db.models import Avg, Count
from django.utils import timezone

from apps.tours.models import Puzzle, PuzzleAttempt, Review, Tour, TourStep

from .level_service import LevelService
from .models import Badge, TourProgress, UserBadge, UserBadgeHistory


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
    VISUAL_TIERS = ("bronze", "silver", "gold", "platinum", "diamond")
    PROGRESSIVE_FAMILIES = {
        "friend_collector": {
            "label": "Friend Collector",
            "code_prefix": "FRIEND_COLLECTOR",
            "thresholds": (1, 5, 15, 50, 150),
            "metric_label": "friends followed",
        },
        "creator": {
            "label": "Creator",
            "code_prefix": "CREATOR",
            "thresholds": (1, 3, 10, 25, 60),
            "metric_label": "tours created",
        },
        "traveller": {
            "label": "Traveller",
            "code_prefix": "TRAVELLER",
            "thresholds": (1, 10, 50, 200, 750),
            "metric_label": "km travelled",
        },
        "popular": {
            "label": "Popular",
            "code_prefix": "POPULAR",
            "thresholds": (1, 10, 50, 250, 1000),
            "metric_label": "followers",
        },
        "ai_creator": {
            "label": "AI Creator",
            "code_prefix": "AI_CREATOR",
            "thresholds": (1, 3, 10, 25, 60),
            "metric_label": "AI tours created",
        },
        "reviewer": {
            "label": "Reviewer",
            "code_prefix": "REVIEWER",
            "thresholds": (1, 5, 20, 60, 150),
            "metric_label": "reviews written",
        },
        "streak": {
            "label": "Streak",
            "code_prefix": "STREAK",
            "thresholds": (2, 7, 14, 30, 90),
            "metric_label": "max consecutive login days",
        },
        "badge_collector": {
            "label": "Badge Collector",
            "code_prefix": "BADGE_COLLECTOR",
            "thresholds": (3, 10, 25, 50, 100),
            "metric_label": "badges earned",
        },
        "explorer": {
            "label": "Explorer",
            "code_prefix": "EXPLORER",
            "thresholds": (2, 5, 15, 40, 100),
            "metric_label": "cities explored",
        },
        "gourmett": {
            "label": "Gourmett",
            "code_prefix": "GOURMETT",
            "thresholds": (3, 10, 30, 75, 150),
            "metric_label": "quality tour reviews",
        },
    }
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
            criteria={
                "kind": "city_first_completion",
                "family": "city",
                "tier": "gold",
                "tier_index": 3,
                "visual_tier": "gold",
            },
        )
        cls._ensure_badge(
            cls.CITY_SILVER_CODE,
            name="City Silver",
            description="Completed your first tour in a city with one mistake.",
            criteria={
                "kind": "city_first_completion",
                "family": "city",
                "tier": "silver",
                "tier_index": 2,
                "visual_tier": "silver",
            },
        )
        cls._ensure_badge(
            cls.CITY_BRONZE_CODE,
            name="City Bronze",
            description="Completed your first tour in a city with two mistakes.",
            criteria={
                "kind": "city_first_completion",
                "family": "city",
                "tier": "bronze",
                "tier_index": 1,
                "visual_tier": "bronze",
            },
        )
        for xp_threshold, code, name in cls.XP_MILESTONES:
            if code == cls.XP_100_CODE:
                visual_tier = "xp1"
                tier_index = 1
            elif code == cls.XP_500_CODE:
                visual_tier = "xp2"
                tier_index = 2
            else:
                visual_tier = "xp3"
                tier_index = 3
            cls._ensure_badge(
                code,
                name=name,
                description=f"Earned at least {xp_threshold} XP.",
                criteria={
                    "kind": "xp_milestone",
                    "family": "xp",
                    "xp": xp_threshold,
                    "tier_index": tier_index,
                    "visual_tier": visual_tier,
                },
            )
        for family_key, definition in cls.PROGRESSIVE_FAMILIES.items():
            for index, threshold in enumerate(definition["thresholds"], start=1):
                code = f"{definition['code_prefix']}_{index}"
                visual_tier = cls.VISUAL_TIERS[
                    min(index - 1, len(cls.VISUAL_TIERS) - 1)
                ]
                cls._ensure_badge(
                    code,
                    name=f"{definition['label']} {index}",
                    description=(
                        f"Reach {threshold} {definition['metric_label']} "
                        f"for {definition['label']} tier {index}."
                    ),
                    criteria={
                        "kind": "progressive_metric",
                        "family": family_key,
                        "tier_index": index,
                        "threshold": threshold,
                        "visual_tier": visual_tier,
                    },
                )

    @classmethod
    def _family_tier_codes(cls, family_key):
        definition = cls.PROGRESSIVE_FAMILIES[family_key]
        return [
            f"{definition['code_prefix']}_{index}"
            for index in range(1, len(definition["thresholds"]) + 1)
        ]

    @classmethod
    def sync_login_streak(cls, user, today=None):
        today = today or timezone.localdate()
        last_date = user.last_login_streak_date
        if last_date == today:
            return False

        if last_date and (today - last_date).days == 1:
            user.current_login_streak += 1
        else:
            user.current_login_streak = 1

        if user.current_login_streak > user.max_login_streak:
            user.max_login_streak = user.current_login_streak

        user.last_login_streak_date = today
        user.save(
            update_fields=[
                "current_login_streak",
                "max_login_streak",
                "last_login_streak_date",
            ]
        )
        return True

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

    @classmethod
    def _metric_value_for_family(cls, *, family_key, user):
        if family_key == "friend_collector":
            return int(user.following_count or 0)
        if family_key == "creator":
            return Tour.objects.filter(creator=user).count()
        if family_key == "traveller":
            return float(user.total_walked_km or 0)
        if family_key == "popular":
            return int(user.follower_count or 0)
        if family_key == "ai_creator":
            return Tour.objects.filter(creator=user, generation_source=Tour.AI).count()
        if family_key == "reviewer":
            return Review.objects.filter(user=user).count()
        if family_key == "streak":
            return int(user.max_login_streak or 0)
        if family_key == "badge_collector":
            badges = UserBadge.objects.select_related("badge").filter(user=user)
            return sum(
                1
                for item in badges
                if not (item.badge.code or "").startswith("BADGE_COLLECTOR_")
            )
        if family_key == "explorer":
            return (
                TourProgress.objects.filter(user=user, has_completed_once=True)
                .exclude(tour__city="")
                .values_list("tour__city", flat=True)
                .distinct()
                .count()
            )
        if family_key == "gourmett":
            data = Review.objects.filter(tour__creator=user).aggregate(
                count=Count("id"),
                avg=Avg("rating"),
            )
            count = int(data.get("count") or 0)
            avg = float(data.get("avg") or 0)
            if avg < 4.5:
                return 0
            return count
        return 0

    @classmethod
    def _award_or_upgrade_progressive_badge(
        cls,
        *,
        user,
        family_key,
        metric_value,
        source_tour=None,
    ):
        thresholds = cls.PROGRESSIVE_FAMILIES[family_key]["thresholds"]
        reached_tier = 0
        for index, threshold in enumerate(thresholds, start=1):
            if metric_value >= threshold:
                reached_tier = index

        if reached_tier == 0:
            return []

        candidate_code = cls._family_tier_codes(family_key)[reached_tier - 1]
        candidate_badge = Badge.objects.filter(code=candidate_code).first()
        if candidate_badge is None:
            return []

        family_codes = cls._family_tier_codes(family_key)
        existing = list(
            UserBadge.objects.select_related("badge").filter(
                user=user,
                city="",
                country_code="ZZ",
                badge__code__in=family_codes,
            )
        )

        best_existing = None
        best_rank = -1
        for row in existing:
            rank = (
                family_codes.index(row.badge.code) + 1
                if row.badge.code in family_codes
                else 0
            )
            if rank > best_rank:
                best_rank = rank
                best_existing = row

        for row in existing:
            if best_existing and row.id != best_existing.id:
                row.delete()

        if best_existing is None:
            user_badge = UserBadge.objects.create(
                user=user,
                badge=candidate_badge,
                city="",
                country_code="ZZ",
                source_tour=source_tour,
            )
            cls._record_badge_history(
                user=user,
                badge=candidate_badge,
                user_badge=user_badge,
                source_tour=source_tour,
            )
            return [candidate_badge.name]

        if reached_tier > best_rank:
            best_existing.badge = candidate_badge
            best_existing.source_tour = source_tour
            best_existing.save(update_fields=["badge", "source_tour"])
            cls._record_badge_history(
                user=user,
                badge=candidate_badge,
                user_badge=best_existing,
                source_tour=source_tour,
                event_type=UserBadgeHistory.UPGRADED,
            )
            return [candidate_badge.name]

        return []

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

    @classmethod
    def _award_progressive_metric_badges(cls, user, completed_progress=None):
        earned = []
        source_tour = (
            completed_progress.tour if completed_progress is not None else None
        )
        family_keys = [
            key for key in cls.PROGRESSIVE_FAMILIES.keys() if key != "badge_collector"
        ] + ["badge_collector"]
        for family_key in family_keys:
            metric_value = cls._metric_value_for_family(
                family_key=family_key, user=user
            )
            earned.extend(
                cls._award_or_upgrade_progressive_badge(
                    user=user,
                    family_key=family_key,
                    metric_value=metric_value,
                    source_tour=source_tour,
                )
            )
        return earned

    @classmethod
    def evaluate_user_badges(cls, user, completed_progress=None):
        """
        Checks all badges against the user's stats and awards them if criteria are met.
        """
        cls.ensure_default_badges()
        newly_earned = []
        if completed_progress is not None:
            newly_earned.extend(
                cls._award_or_upgrade_city_badge(user, completed_progress)
            )
        newly_earned.extend(cls._award_xp_milestone_badges(user, completed_progress))
        newly_earned.extend(
            cls._award_progressive_metric_badges(user, completed_progress)
        )
        return newly_earned

    @classmethod
    def check_badges(cls, user, completed_progress=None):
        return cls.evaluate_user_badges(user, completed_progress)


class TourRewardService:
    AR_PICTURE_FAILURE_WINDOW = 3
    PUZZLE_REWARD_RULES = {
        Puzzle.TRIVIA: {
            "xp": Puzzle.TRIVIA_XP_REWARD,
            "requires_submission": True,
            "max_failed_attempts": 0,
        },
        Puzzle.OPEN_ENDED: {
            "xp": Puzzle.TRIVIA_XP_REWARD,
            "requires_submission": True,
            "max_failed_attempts": AR_PICTURE_FAILURE_WINDOW - 1,
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

    @staticmethod
    def _current_step(progress):
        if progress.current_step_id is None:
            return None
        return TourStep.objects.filter(
            tour=progress.tour,
            id=progress.current_step_id,
        ).first()

    @classmethod
    def city_badge_mistake_count(cls, *, user, progress) -> int:
        failed_attempts = PuzzleAttempt.objects.filter(
            user=user,
            progress=progress,
            accepted=False,
        )
        ar_picture_failed_attempts = failed_attempts.filter(
            puzzle__puzzle_type__in=(
                Puzzle.AR,
                Puzzle.PICTURE_COMPARE,
                Puzzle.OPEN_ENDED,
            )
        ).count()
        other_failed_attempts = failed_attempts.exclude(
            puzzle__puzzle_type__in=(
                Puzzle.AR,
                Puzzle.PICTURE_COMPARE,
                Puzzle.OPEN_ENDED,
            )
        ).count()
        ar_picture_badge_penalty = (
            ar_picture_failed_attempts // cls.AR_PICTURE_FAILURE_WINDOW
        )
        return progress.skip_count + other_failed_attempts + ar_picture_badge_penalty

    @classmethod
    def requires_submission_before_completion(cls, *, progress, user):
        current_step = cls._current_step(progress)
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
        current_step = cls._current_step(progress)
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

        if puzzle.puzzle_type in (Puzzle.AR, Puzzle.PICTURE_COMPARE, Puzzle.OPEN_ENDED):
            return failed_count < cls.AR_PICTURE_FAILURE_WINDOW

        return False

    @staticmethod
    def step_xp_for_completion(*, progress, user) -> int:
        current_step = TourRewardService._current_step(progress)
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
