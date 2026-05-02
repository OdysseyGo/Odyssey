from django.db import migrations, models


def forward_backfill_tour_review_status(apps, schema_editor):
    Tour = apps.get_model("tours", "Tour")
    Tour.objects.exclude(status__in=["PENDING", "PUBLISHED", "ARCHIVED"]).update(
        status="PENDING",
        review_status="REJECTED",
    )
    Tour.objects.filter(status="PENDING", review_status__isnull=True).update(
        review_status="IN_REVIEW"
    )
    Tour.objects.exclude(status="PENDING").update(review_status=None)


def reverse_backfill_tour_review_status(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0026_merge_20260502_0018"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tour",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Pending"),
                    ("PUBLISHED", "Published"),
                    ("ARCHIVED", "Archived"),
                ],
                default="PENDING",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="tour",
            name="review_status",
            field=models.CharField(
                blank=True,
                choices=[("IN_REVIEW", "In Review"), ("REJECTED", "Rejected")],
                max_length=20,
                null=True,
            ),
        ),
        migrations.RunPython(
            forward_backfill_tour_review_status,
            reverse_backfill_tour_review_status,
        ),
    ]
