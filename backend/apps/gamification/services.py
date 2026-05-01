from apps.tours.models import Puzzle, PuzzleAttempt

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

        failed_attempts = PuzzleAttempt.objects.filter(
            user=user,
            progress=completed_progress,
            accepted=False,
        )
        ar_picture_failed_attempts = failed_attempts.filter(
            puzzle__puzzle_type__in=(Puzzle.AR, Puzzle.PICTURE_COMPARE)
        ).count()
        other_failed_attempts = failed_attempts.exclude(
            puzzle__puzzle_type__in=(Puzzle.AR, Puzzle.PICTURE_COMPARE)
        ).count()
        ar_picture_badge_penalty = ar_picture_failed_attempts // 3
        mistake_count = (
            completed_progress.skip_count
            + other_failed_attempts
            + ar_picture_badge_penalty
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
