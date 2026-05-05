from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0013_user_terms_version"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="first_name",
        ),
        migrations.RemoveField(
            model_name="user",
            name="last_name",
        ),
    ]
