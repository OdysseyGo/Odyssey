from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0017_tour_cover_image_url_and_attribution"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="tour",
            name="cover_image_url",
        ),
    ]

