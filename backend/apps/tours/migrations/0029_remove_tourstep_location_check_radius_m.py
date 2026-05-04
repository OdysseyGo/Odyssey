from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0028_tourstep_location_check_radius_m"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="tourstep",
            name="location_check_radius_m",
        ),
    ]
