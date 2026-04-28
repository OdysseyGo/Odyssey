from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0016_backfill_tour_cover_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="tour",
            name="cover_image_url",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="tour",
            name="cover_image_attribution",
            field=models.TextField(blank=True, null=True),
        ),
    ]
