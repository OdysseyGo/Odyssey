from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0027_tour_review_status_pending_only"),
    ]

    operations = [
        migrations.AddField(
            model_name="tourstep",
            name="location_check_radius_m",
            field=models.PositiveIntegerField(
                default=100,
                help_text="Accepted radius in meters for GPS location confirmation.",
            ),
        ),
    ]
