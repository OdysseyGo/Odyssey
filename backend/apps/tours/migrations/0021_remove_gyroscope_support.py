from django.db import migrations, models


def migrate_gyroscope_puzzles_to_compass(apps, schema_editor):
    Puzzle = apps.get_model("tours", "Puzzle")
    CompassPuzzleDetail = apps.get_model("tours", "CompassPuzzleDetail")

    gyroscope_puzzles = Puzzle.objects.filter(puzzle_type="GYROSCOPE")
    for puzzle in gyroscope_puzzles.iterator():
        puzzle.puzzle_type = "COMPASS"
        puzzle.save(update_fields=["puzzle_type"])
        CompassPuzzleDetail.objects.update_or_create(
            puzzle_id=puzzle.id,
            defaults={"target_heading_degrees": 0},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0020_merge_20260501_1134"),
    ]

    operations = [
        migrations.RunPython(
            migrate_gyroscope_puzzles_to_compass, migrations.RunPython.noop
        ),
        migrations.DeleteModel(
            name="GyroscopePuzzleDetail",
        ),
        migrations.AlterField(
            model_name="puzzle",
            name="puzzle_type",
            field=models.CharField(
                choices=[
                    ("TRIVIA", "Trivia"),
                    ("AR", "Augmented Reality"),
                    ("PICTURE_COMPARE", "Picture Compare"),
                    ("COMPASS", "Compass"),
                ],
                max_length=20,
            ),
        ),
    ]
