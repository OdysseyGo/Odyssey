from django.db.models import Q

from apps.tours.models import PuzzleAttempt

from .models import Badge, UserBadge


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
            description="Completed your first tour in a city with one or two mistakes.",
            criteria={"kind": "city_first_completion", "tier": "silver"},
        )
        cls._ensure_badge(
            cls.CITY_BRONZE_CODE,
            name="City Bronze",
            description="Completed your first tour in a city with more than two mistakes.",
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
        if mistake_count <= 2:
            return BadgeService.CITY_SILVER_CODE
        return BadgeService.CITY_BRONZE_CODE

    @staticmethod
    def _completed_in_city_count(user, city, country_code):
        queryset = user.tour_progress.filter(
            status="COMPLETED",
            tour__city__iexact=city,
        )
        if country_code == "ZZ":
            queryset = queryset.filter(
                Q(tour__country_code__iexact="ZZ") | Q(tour__country_code__exact="")
            )
        else:
            queryset = queryset.filter(tour__country_code__iexact=country_code)
        return queryset.count()

    @staticmethod
    def _award_city_first_completion_badge(user, completed_progress):
        tour = completed_progress.tour
        city = (tour.city or "Unknown City").strip() or "Unknown City"
        country_code = (tour.country_code or "ZZ").strip().upper() or "ZZ"
        country_code = country_code[:2]

        if BadgeService._completed_in_city_count(user, city, country_code) != 1:
            return []

        mistake_count = (
            completed_progress.skip_count
            + PuzzleAttempt.objects.filter(
                user=user,
                progress=completed_progress,
                accepted=False,
            ).count()
        )
        badge_code = BadgeService._city_badge_code_from_mistakes(mistake_count)
        badge = Badge.objects.filter(code=badge_code).first()
        if badge is None:
            return []

        _, created = UserBadge.objects.get_or_create(
            user=user,
            badge=badge,
            city=city,
            country_code=country_code,
            defaults={
                "mistake_count": mistake_count,
                "source_tour": tour,
            },
        )
        if created:
            return [badge.name]
        return []

    @staticmethod
    def _award_xp_milestone_badges(user):
        newly_earned = []
        for xp_threshold, badge_code, _ in BadgeService.XP_MILESTONES:
            if user.xp < xp_threshold:
                continue

            badge = Badge.objects.filter(code=badge_code).first()
            if badge is None:
                continue

            _, created = UserBadge.objects.get_or_create(
                user=user,
                badge=badge,
                city="",
                country_code="ZZ",
            )
            if created:
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
                BadgeService._award_city_first_completion_badge(user, completed_progress)
            )
        newly_earned.extend(BadgeService._award_xp_milestone_badges(user))
        return newly_earned
