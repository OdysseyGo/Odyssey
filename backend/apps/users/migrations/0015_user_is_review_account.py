from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0014_remove_user_first_name_last_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_review_account",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Bypass rewarded-ad gates for App/Play Store reviewer accounts. "
                    "Enable only for accounts whose credentials are shared with store reviewers."
                ),
            ),
        ),
    ]
