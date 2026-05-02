from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admin_dashboard", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="category",
            field=models.CharField(
                choices=[
                    ("INAPPROPRIATE", "Inappropriate content"),
                    ("HATE_OR_HARASSMENT", "Hate or harassment"),
                    ("SPAM", "Spam"),
                    ("MISLEADING", "Misleading information"),
                    ("SAFETY", "Safety concern"),
                    ("PRIVACY", "Privacy concern"),
                    ("OTHER", "Other"),
                ],
                default="OTHER",
                max_length=40,
            ),
        ),
    ]
