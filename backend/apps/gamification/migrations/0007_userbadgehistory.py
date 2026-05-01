import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_badge_history(apps, schema_editor):
    UserBadge = apps.get_model("gamification", "UserBadge")
    UserBadgeHistory = apps.get_model("gamification", "UserBadgeHistory")

    history_rows = []
    for user_badge in UserBadge.objects.select_related("badge", "source_tour").all():
        history_rows.append(
            UserBadgeHistory(
                user_id=user_badge.user_id,
                badge_id=user_badge.badge_id,
                user_badge_id=user_badge.id,
                source_tour_id=user_badge.source_tour_id,
                city=user_badge.city,
                country_code=user_badge.country_code,
                mistake_count=user_badge.mistake_count,
                event_type="EARNED",
                earned_at=user_badge.earned_at,
            )
        )

    if history_rows:
        UserBadgeHistory.objects.bulk_create(history_rows)


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tours", "0020_merge_20260501_1134"),
        ("gamification", "0006_merge_20260428_2241"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserBadgeHistory",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("city", models.CharField(blank=True, default="", max_length=100)),
                (
                    "country_code",
                    models.CharField(blank=True, default="ZZ", max_length=2),
                ),
                ("mistake_count", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "event_type",
                    models.CharField(
                        choices=[("EARNED", "Earned"), ("UPGRADED", "Upgraded")],
                        default="EARNED",
                        max_length=20,
                    ),
                ),
                ("earned_at", models.DateTimeField(auto_now_add=True)),
                (
                    "badge",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="gamification.badge",
                    ),
                ),
                (
                    "source_tour",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="badge_award_history",
                        to="tours.tour",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="badge_history",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user_badge",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="history",
                        to="gamification.userbadge",
                    ),
                ),
            ],
            options={
                "ordering": ["-earned_at"],
            },
        ),
        migrations.RunPython(backfill_badge_history, migrations.RunPython.noop),
    ]
