from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_rename_token_user_credit"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="avatar_url",
            field=models.URLField(
                blank=True,
                default="",
                help_text="DiceBear avatar URL",
                max_length=500,
            ),
        ),
    ]
