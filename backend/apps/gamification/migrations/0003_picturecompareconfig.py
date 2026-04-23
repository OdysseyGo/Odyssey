from django.db import migrations, models


def create_default_config(apps, schema_editor):
    PictureCompareConfig = apps.get_model("gamification", "PictureCompareConfig")
    PictureCompareConfig.objects.get_or_create(singleton_id=1)


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0002_tourprogress_skip_count_tourprogress_total_xp"),
    ]

    operations = [
        migrations.CreateModel(
            name="PictureCompareConfig",
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
                    models.PositiveSmallIntegerField(default=1, editable=False, unique=True),
                ),
                ("similarity_threshold", models.FloatField(default=0.7)),
                ("fast_reject_threshold", models.FloatField(default=0.35)),
                ("base_weight", models.FloatField(default=0.45)),
                ("edge_weight", models.FloatField(default=0.25)),
                ("histogram_weight", models.FloatField(default=0.15)),
                ("grid_weight", models.FloatField(default=0.15)),
                ("histogram_penalty_threshold", models.FloatField(default=0.78)),
                ("grid_penalty_threshold", models.FloatField(default=0.72)),
                ("histogram_penalty_multiplier", models.FloatField(default=0.82)),
                ("grid_penalty_multiplier", models.FloatField(default=0.82)),
                ("fast_max_shift", models.PositiveSmallIntegerField(default=8)),
                ("fast_step", models.PositiveSmallIntegerField(default=2)),
                ("final_max_shift", models.PositiveSmallIntegerField(default=12)),
                ("final_step", models.PositiveSmallIntegerField(default=2)),
                ("edge_max_shift", models.PositiveSmallIntegerField(default=12)),
                ("edge_step", models.PositiveSmallIntegerField(default=2)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.RunPython(create_default_config, migrations.RunPython.noop),
    ]
