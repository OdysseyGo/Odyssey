from django.db import migrations, models


def backfill_has_completed_once(apps, schema_editor):
    TourProgress = apps.get_model("gamification", "TourProgress")
    TourProgress.objects.filter(status="COMPLETED").update(has_completed_once=True)


def clear_has_completed_once(apps, schema_editor):
    TourProgress = apps.get_model("gamification", "TourProgress")
    TourProgress.objects.update(has_completed_once=False)


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0005_tourprogress_wrong_attempt_count"),
    ]

    operations = [
        migrations.AddField(
            model_name="tourprogress",
            name="has_completed_once",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(backfill_has_completed_once, clear_has_completed_once),
    ]
