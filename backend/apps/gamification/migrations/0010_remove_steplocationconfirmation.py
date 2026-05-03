from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0009_steplocationconfirmation"),
    ]

    operations = [
        migrations.DeleteModel(
            name="StepLocationConfirmation",
        ),
    ]
