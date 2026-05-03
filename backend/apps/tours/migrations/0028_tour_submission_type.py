from django.db import migrations, models


def backfill_submission_type(apps, schema_editor):
    Tour = apps.get_model("tours", "Tour")
    Tour.objects.filter(submission_type="").update(submission_type="CREATE")
    Tour.objects.filter(submission_type__isnull=True).update(submission_type="CREATE")


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0027_tour_review_status_pending_only"),
    ]

    operations = [
        migrations.AddField(
            model_name="tour",
            name="submission_type",
            field=models.CharField(
                choices=[("CREATE", "Create"), ("EDIT", "Edit"), ("DELETE", "Delete")],
                default="CREATE",
                help_text="Indicates what kind of creator submission is currently under review.",
                max_length=10,
            ),
        ),
        migrations.RunPython(
            backfill_submission_type,
            migrations.RunPython.noop,
        ),
    ]
