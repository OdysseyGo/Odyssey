from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("gamification", "0002_tourprogress_skip_count_tourprogress_total_xp"),
        ("tours", "0008_tour_cover_image"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="puzzle",
            name="reference_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="puzzle_reference_images/",
            ),
        ),
        migrations.AlterField(
            model_name="puzzle",
            name="puzzle_type",
            field=models.CharField(
                choices=[
                    ("TRIVIA", "Trivia"),
                    ("AR", "Augmented Reality"),
                    ("GYROSCOPE", "Gyroscope"),
                    ("PICTURE_COMPARE", "Picture Compare"),
                ],
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="PuzzleAttempt",
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
                ("attempt_image", models.ImageField(upload_to="puzzle_attempts/")),
                ("similarity_score", models.FloatField(blank=True, null=True)),
                ("accepted", models.BooleanField(default=False)),
                ("processing_ms", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "progress",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="puzzle_attempts",
                        to="gamification.tourprogress",
                    ),
                ),
                (
                    "puzzle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attempts",
                        to="tours.puzzle",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="puzzle_attempts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
