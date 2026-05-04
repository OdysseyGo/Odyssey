from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0008_merge_20260501_1620"),
        ("tours", "0028_tourstep_location_check_radius_m"),
    ]

    operations = [
        migrations.CreateModel(
            name="StepLocationConfirmation",
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
                    "checked_latitude",
                    models.DecimalField(decimal_places=9, max_digits=18),
                ),
                (
                    "checked_longitude",
                    models.DecimalField(decimal_places=9, max_digits=18),
                ),
                ("distance_m", models.FloatField()),
                ("confirmed_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "progress",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="location_confirmations",
                        to="gamification.tourprogress",
                    ),
                ),
                (
                    "step",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="location_confirmations",
                        to="tours.tourstep",
                    ),
                ),
            ],
            options={
                "unique_together": {("progress", "step")},
            },
        ),
    ]
