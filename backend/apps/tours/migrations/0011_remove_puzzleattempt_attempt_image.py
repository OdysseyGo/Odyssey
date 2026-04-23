from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0010_puzzle_detail_models"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="puzzleattempt",
            name="attempt_image",
        ),
    ]
