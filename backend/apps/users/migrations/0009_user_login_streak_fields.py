from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0008_user_total_walked_km"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="current_login_streak",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="user",
            name="last_login_streak_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="max_login_streak",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
