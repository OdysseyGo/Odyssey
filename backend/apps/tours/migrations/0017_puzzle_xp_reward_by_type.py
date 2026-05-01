from django.db import migrations


def backfill_puzzle_xp_reward_by_type(apps, schema_editor):
    Puzzle = apps.get_model("tours", "Puzzle")
    Puzzle.objects.filter(puzzle_type="TRIVIA").update(xp_reward=25)
    Puzzle.objects.exclude(puzzle_type="TRIVIA").update(xp_reward=50)


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0016_puzzle_xp_reward_fixed_25"),
    ]

    operations = [
        migrations.RunPython(
            backfill_puzzle_xp_reward_by_type, migrations.RunPython.noop
        ),
    ]
