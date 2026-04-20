from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.utils import timezone

from apps.admin_dashboard.models import Report
from apps.gamification.models import TourProgress
from apps.tours.models import Review, Tour
from apps.users.models import User

TRUNC_MAP = {
    "daily": TruncDay,
    "weekly": TruncWeek,
    "monthly": TruncMonth,
}


class AnalyticsService:
    @staticmethod
    def get_dashboard_summary():
        now = timezone.now()
        return {
            "total_users": User.objects.count(),
            "total_tours": Tour.objects.count(),
            "total_reviews": Review.objects.count(),
            "new_users_7d": User.objects.filter(
                date_joined__gte=now - timedelta(days=7)
            ).count(),
            "new_users_30d": User.objects.filter(
                date_joined__gte=now - timedelta(days=30)
            ).count(),
            "new_tours_7d": Tour.objects.filter(
                created_at__gte=now - timedelta(days=7)
            ).count(),
            "new_tours_30d": Tour.objects.filter(
                created_at__gte=now - timedelta(days=30)
            ).count(),
            "active_users_7d": TourProgress.objects.filter(
                started_at__gte=now - timedelta(days=7)
            )
            .values("user")
            .distinct()
            .count(),
            "pending_reports": Report.objects.filter(status=Report.PENDING).count(),
        }

    @staticmethod
    def get_user_growth(period="daily", days=30):
        trunc_fn = TRUNC_MAP.get(period, TruncDay)
        since = timezone.now() - timedelta(days=days)
        return (
            User.objects.filter(date_joined__gte=since)
            .annotate(date=trunc_fn("date_joined"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

    @staticmethod
    def get_tour_growth(period="daily", days=30):
        trunc_fn = TRUNC_MAP.get(period, TruncDay)
        since = timezone.now() - timedelta(days=days)
        return (
            Tour.objects.filter(created_at__gte=since)
            .annotate(date=trunc_fn("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

    @staticmethod
    def get_top_tours(order_by="rating", limit=10):
        qs = Tour.objects.filter(status=Tour.PUBLISHED).annotate(
            avg_rating=Avg("reviews__rating"),
            completion_count=Count(
                "progress", filter=Q(progress__status=TourProgress.COMPLETED)
            ),
        )

        if order_by == "rating":
            qs = qs.order_by("-avg_rating")
        else:
            qs = qs.order_by("-completion_count")

        results = []
        for tour in qs[:limit]:
            value = tour.avg_rating if order_by == "rating" else tour.completion_count
            results.append(
                {
                    "id": tour.id,
                    "title": tour.title,
                    "creator_username": tour.creator.username,
                    "value": float(value) if value is not None else 0.0,
                }
            )
        return results

    @staticmethod
    def get_distributions():
        user_type_dist = list(
            User.objects.values("user_type")
            .annotate(count=Count("id"))
            .order_by("user_type")
        )
        tour_type_dist = list(
            Tour.objects.values("tour_type")
            .annotate(count=Count("id"))
            .order_by("tour_type")
        )
        difficulty_dist = list(
            Tour.objects.values("difficulty")
            .annotate(count=Count("id"))
            .order_by("difficulty")
        )

        user_type_labels = dict(User.USER_TYPE_CHOICES)
        tour_type_labels = dict(Tour.TOUR_TYPE_CHOICES)
        difficulty_labels = dict(Tour.DIFFICULTY_CHOICES)

        return {
            "user_types": [
                {
                    "label": user_type_labels.get(d["user_type"], str(d["user_type"])),
                    "count": d["count"],
                }
                for d in user_type_dist
            ],
            "tour_types": [
                {
                    "label": tour_type_labels.get(d["tour_type"], d["tour_type"]),
                    "count": d["count"],
                }
                for d in tour_type_dist
            ],
            "difficulties": [
                {
                    "label": difficulty_labels.get(d["difficulty"], d["difficulty"]),
                    "count": d["count"],
                }
                for d in difficulty_dist
            ],
        }

    @staticmethod
    def get_active_users(days=7):
        since = timezone.now() - timedelta(days=days)
        return (
            TourProgress.objects.filter(started_at__gte=since)
            .values("user")
            .distinct()
            .count()
        )

    @staticmethod
    def get_revenue_summary():
        from django.db.models import Sum

        from apps.payments.models import Subscription, Transaction

        total_credits_sold = (
            Transaction.objects.filter(transaction_type=Transaction.PURCHASE).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        active_subscriptions = Subscription.objects.filter(
            status=Subscription.ACTIVE
        ).count()
        monthly_subs = Subscription.objects.filter(
            status=Subscription.ACTIVE, plan=Subscription.MONTHLY
        ).count()
        yearly_subs = Subscription.objects.filter(
            status=Subscription.ACTIVE, plan=Subscription.YEARLY
        ).count()
        premium_tours = Tour.objects.filter(credit_price__gt=0).count()
        total_tour_unlocks = Transaction.objects.filter(
            transaction_type=Transaction.TOUR_UNLOCK
        ).count()

        return {
            "total_credits_sold": total_credits_sold,
            "active_subscriptions": active_subscriptions,
            "monthly_subscriptions": monthly_subs,
            "yearly_subscriptions": yearly_subs,
            "premium_tours": premium_tours,
            "total_tour_unlocks": total_tour_unlocks,
        }
