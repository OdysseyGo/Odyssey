from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_merge_0005_ai_gen_0006"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="stripe_customer_id",
        ),
    ]
