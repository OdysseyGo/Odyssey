from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0030_merge_20260504_0001"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tour",
            name="description",
            field=models.TextField(max_length=1000),
        ),
        migrations.AlterField(
            model_name="tourstep",
            name="description",
            field=models.TextField(
                blank=True,
                help_text="Story content or location description",
                max_length=1000,
            ),
        ),
    ]
