from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ads", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="adplacement",
            name="reward_type",
            field=models.CharField(
                choices=[
                    ("NONE", "None"),
                    ("CREDITS", "Credits"),
                    ("AI_SLOT", "AI Generation Slot"),
                    ("HINT", "Puzzle Hint or Skip"),
                    ("REVIVE", "Tour Revive After Failure"),
                ],
                default="NONE",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="rewardedadgrant",
            name="reward_type",
            field=models.CharField(
                choices=[
                    ("CREDITS", "Credits"),
                    ("AI_SLOT", "AI Generation Slot"),
                    ("HINT", "Puzzle Hint or Skip"),
                    ("REVIVE", "Tour Revive After Failure"),
                ],
                max_length=20,
            ),
        ),
    ]
