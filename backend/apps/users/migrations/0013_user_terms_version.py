from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0012_user_terms_accepted_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="terms_version",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
