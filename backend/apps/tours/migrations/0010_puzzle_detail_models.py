from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def forwards_populate_puzzle_details(apps, schema_editor):
    Puzzle = apps.get_model("tours", "Puzzle")
    TriviaPuzzleDetail = apps.get_model("tours", "TriviaPuzzleDetail")
    PictureComparePuzzleDetail = apps.get_model("tours", "PictureComparePuzzleDetail")
    ArPuzzleDetail = apps.get_model("tours", "ArPuzzleDetail")
    GyroscopePuzzleDetail = apps.get_model("tours", "GyroscopePuzzleDetail")

    for puzzle in Puzzle.objects.all().iterator():
        if puzzle.puzzle_type == "TRIVIA":
            TriviaPuzzleDetail.objects.update_or_create(
                puzzle_id=puzzle.id,
                defaults={
                    "options": puzzle.options or [],
                    "correct_answer": puzzle.correct_answer,
                },
            )
            continue

        if puzzle.puzzle_type == "PICTURE_COMPARE" and puzzle.reference_image:
            PictureComparePuzzleDetail.objects.update_or_create(
                puzzle_id=puzzle.id,
                defaults={
                    "reference_image": puzzle.reference_image,
                    "similarity_threshold": 0.7,
                },
            )
            continue

        if puzzle.puzzle_type == "AR":
            ArPuzzleDetail.objects.get_or_create(
                puzzle_id=puzzle.id,
                defaults={
                    "scene_asset_url": "",
                    "metadata": {},
                },
            )
            continue

        if puzzle.puzzle_type == "GYROSCOPE":
            GyroscopePuzzleDetail.objects.get_or_create(
                puzzle_id=puzzle.id,
                defaults={
                    "target_pitch": 0.0,
                    "target_roll": 0.0,
                    "target_yaw": 0.0,
                    "tolerance_degrees": 15.0,
                },
            )


def backwards_restore_legacy_fields(apps, schema_editor):
    Puzzle = apps.get_model("tours", "Puzzle")
    TriviaPuzzleDetail = apps.get_model("tours", "TriviaPuzzleDetail")
    PictureComparePuzzleDetail = apps.get_model("tours", "PictureComparePuzzleDetail")

    for puzzle in Puzzle.objects.filter(puzzle_type="TRIVIA").iterator():
        try:
            detail = TriviaPuzzleDetail.objects.get(puzzle_id=puzzle.id)
        except TriviaPuzzleDetail.DoesNotExist:
            continue

        puzzle.options = detail.options
        puzzle.correct_answer = detail.correct_answer
        puzzle.save(update_fields=["options", "correct_answer"])

    for puzzle in Puzzle.objects.filter(puzzle_type="PICTURE_COMPARE").iterator():
        try:
            detail = PictureComparePuzzleDetail.objects.get(puzzle_id=puzzle.id)
        except PictureComparePuzzleDetail.DoesNotExist:
            continue

        puzzle.reference_image = detail.reference_image
        puzzle.save(update_fields=["reference_image"])


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0009_picture_compare_puzzle_attempt"),
    ]

    operations = [
        migrations.AddField(
            model_name="puzzle",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="puzzle",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name="TriviaPuzzleDetail",
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
                    "options",
                    models.JSONField(
                        default=list,
                        help_text="Multiple choice options for TRIVIA puzzles",
                    ),
                ),
                ("correct_answer", models.CharField(max_length=255)),
                (
                    "puzzle",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="trivia_detail",
                        to="tours.puzzle",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PictureComparePuzzleDetail",
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
                    "reference_image",
                    models.ImageField(upload_to="puzzle_reference_images/"),
                ),
                ("similarity_threshold", models.FloatField(default=0.7)),
                (
                    "puzzle",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="picture_compare_detail",
                        to="tours.puzzle",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ArPuzzleDetail",
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
                ("scene_asset_url", models.URLField(blank=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "puzzle",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ar_detail",
                        to="tours.puzzle",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="GyroscopePuzzleDetail",
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
                ("target_pitch", models.FloatField(default=0.0)),
                ("target_roll", models.FloatField(default=0.0)),
                ("target_yaw", models.FloatField(default=0.0)),
                ("tolerance_degrees", models.FloatField(default=15.0)),
                (
                    "puzzle",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gyroscope_detail",
                        to="tours.puzzle",
                    ),
                ),
            ],
        ),
        migrations.RunPython(
            forwards_populate_puzzle_details,
            backwards_restore_legacy_fields,
        ),
    ]
