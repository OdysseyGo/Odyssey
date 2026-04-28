from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0004_badge_code_userbadge_context_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="BadgeVisualTemplate",
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
                (
                    "singleton_id",
                    models.PositiveSmallIntegerField(
                        default=1, editable=False, unique=True
                    ),
                ),
                ("config", models.JSONField(default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="BadgeVisualOverride",
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
                ("country_code", models.CharField(blank=True, default="", max_length=2)),
                ("config", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "badge",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visual_overrides",
                        to="gamification.badge",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="badgevisualoverride",
            constraint=models.UniqueConstraint(
                fields=("badge", "country_code"),
                name="uniq_badge_visual_override_badge_country",
            ),
        ),
    ]
