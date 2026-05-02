from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0011_merge_20260502_0038"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="terms_accepted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
