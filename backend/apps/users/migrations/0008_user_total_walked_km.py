from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0007_searchhistory"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="total_walked_km",
            field=models.DecimalField(decimal_places=3, default=0, max_digits=12),
        ),
    ]
