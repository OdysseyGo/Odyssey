from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gamification", "0004_badge_code_userbadge_context_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="tourprogress",
            name="wrong_attempt_count",
            field=models.IntegerField(default=0),
        ),
    ]
