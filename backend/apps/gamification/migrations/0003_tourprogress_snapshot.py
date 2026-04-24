from django.db import migrations, models


def snapshot_in_progress(apps, schema_editor):
    """Copy the current_step FK into the new integer field, and build a
    tour_snapshot for every in-progress row so existing players don't lose
    their position when the FK column is dropped."""
    TourProgress = apps.get_model("gamification", "TourProgress")
    TourStep = apps.get_model("tours", "TourStep")
    Puzzle = apps.get_model("tours", "Puzzle")

    for progress in TourProgress.objects.all():
        progress._tmp_current_step_id = progress.current_step_id

        if progress.status != "IN_PROGRESS":
            progress.save(update_fields=["_tmp_current_step_id"])
            continue

        steps = []
        for step in TourStep.objects.filter(tour=progress.tour).order_by("order"):
            puzzle = Puzzle.objects.filter(step=step).first()
            steps.append(
                {
                    "id": step.id,
                    "order": step.order,
                    "title": step.title,
                    "description": step.description,
                    "latitude": str(step.latitude),
                    "longitude": str(step.longitude),
                    "image": step.image.url if step.image else None,
                    "audio": step.audio.url if step.audio else None,
                    "puzzle": (
                        {
                            "id": puzzle.id,
                            "puzzle_type": puzzle.puzzle_type,
                            "question": puzzle.question,
                            "options": puzzle.options,
                            "correct_answer": puzzle.correct_answer,
                            "hint": puzzle.hint,
                            "xp_reward": puzzle.xp_reward,
                        }
                        if puzzle
                        else None
                    ),
                }
            )

        tour = progress.tour
        progress.tour_snapshot = {
            "id": tour.id,
            "title": tour.title,
            "description": tour.description,
            "tour_type": tour.tour_type,
            "steps": steps,
        }
        progress.save(update_fields=["_tmp_current_step_id", "tour_snapshot"])


class Migration(migrations.Migration):

    dependencies = [
        ("gamification", "0002_tourprogress_skip_count_tourprogress_total_xp"),
        ("tours", "0009_tour_credit_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="tourprogress",
            name="tour_snapshot",
            field=models.JSONField(
                blank=True,
                help_text="Frozen tour payload (steps + puzzles) captured when progress started.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="tourprogress",
            name="_tmp_current_step_id",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.RunPython(snapshot_in_progress, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="tourprogress",
            name="current_step",
        ),
        migrations.RenameField(
            model_name="tourprogress",
            old_name="_tmp_current_step_id",
            new_name="current_step_id",
        ),
    ]
