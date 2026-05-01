from django.db import migrations, models


def backfill_puzzle_xp_reward(apps, schema_editor):
    Puzzle = apps.get_model("tours", "Puzzle")
    Puzzle.objects.all().update(xp_reward=25)


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0015_merge_20260426_1207"),
    ]

    operations = [
        migrations.RunPython(backfill_puzzle_xp_reward, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="puzzle",
            name="xp_reward",
            field=models.PositiveIntegerField(default=25),
        ),
    ]
