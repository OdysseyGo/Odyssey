import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AdPlacement",
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
                ("key", models.SlugField(max_length=64, unique=True)),
                ("description", models.CharField(blank=True, max_length=255)),
                (
                    "ad_format",
                    models.CharField(
                        choices=[
                            ("BANNER", "Banner"),
                            ("INTERSTITIAL", "Interstitial"),
                            ("REWARDED", "Rewarded"),
                        ],
                        max_length=20,
                    ),
                ),
                ("ad_unit_id_ios", models.CharField(blank=True, max_length=128)),
                ("ad_unit_id_android", models.CharField(blank=True, max_length=128)),
                ("enabled", models.BooleanField(default=True)),
                ("frequency_cap_per_day", models.PositiveIntegerField(default=0)),
                ("min_seconds_between", models.PositiveIntegerField(default=0)),
                (
                    "reward_type",
                    models.CharField(
                        choices=[
                            ("NONE", "None"),
                            ("CREDITS", "Credits"),
                            ("AI_SLOT", "AI Generation Slot"),
                            ("HINT", "Puzzle Hint or Skip"),
                        ],
                        default="NONE",
                        max_length=20,
                    ),
                ),
                ("reward_amount", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "ad_placement"},
        ),
        migrations.CreateModel(
            name="AdImpression",
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
                    "platform",
                    models.CharField(
                        choices=[("ios", "iOS"), ("android", "Android")],
                        max_length=10,
                    ),
                ),
                (
                    "client_request_id",
                    models.UUIDField(default=uuid.uuid4, unique=True),
                ),
                ("shown_at", models.DateTimeField(auto_now_add=True)),
                (
                    "placement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="impressions",
                        to="ads.adplacement",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ad_impressions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "ad_impression",
                "ordering": ["-shown_at"],
            },
        ),
        migrations.AddIndex(
            model_name="adimpression",
            index=models.Index(
                fields=["user", "placement", "shown_at"],
                name="ad_impressi_user_id_pl_idx",
            ),
        ),
        migrations.CreateModel(
            name="RewardedAdGrant",
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
                    "admob_transaction_id",
                    models.CharField(db_index=True, max_length=128, unique=True),
                ),
                (
                    "reward_type",
                    models.CharField(
                        choices=[
                            ("CREDITS", "Credits"),
                            ("AI_SLOT", "AI Generation Slot"),
                            ("HINT", "Puzzle Hint or Skip"),
                        ],
                        max_length=20,
                    ),
                ),
                ("reward_amount", models.PositiveIntegerField()),
                ("granted_at", models.DateTimeField(auto_now_add=True)),
                ("consumed_at", models.DateTimeField(blank=True, null=True)),
                ("consumed_context", models.JSONField(blank=True, default=dict)),
                (
                    "placement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="grants",
                        to="ads.adplacement",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rewarded_grants",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "rewarded_ad_grant",
                "ordering": ["-granted_at"],
            },
        ),
    ]
