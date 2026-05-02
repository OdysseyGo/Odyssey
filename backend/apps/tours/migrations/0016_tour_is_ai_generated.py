from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0015_merge_20260426_1207"),
    ]

    operations = [
        migrations.AddField(
            model_name="tour",
            name="is_ai_generated",
            field=models.BooleanField(default=False),
        ),
    ]
