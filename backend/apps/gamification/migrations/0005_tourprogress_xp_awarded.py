from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0004_badge_code_userbadge_context_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="tourprogress",
            name="xp_awarded",
            field=models.BooleanField(default=False),
        ),
    ]
