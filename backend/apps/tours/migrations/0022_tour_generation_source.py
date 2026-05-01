from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0021_remove_gyroscope_support"),
    ]

    operations = [
        migrations.AddField(
            model_name="tour",
            name="generation_source",
            field=models.CharField(
                choices=[("USER", "User"), ("AI", "AI")],
                default="USER",
                help_text=(
                    "Indicates whether the tour was manually created or AI generated."
                ),
                max_length=10,
            ),
        ),
    ]
