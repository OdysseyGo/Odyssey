from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0002_add_admin_adjustment_transaction_type"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="creditpack",
            name="stripe_price_id",
        ),
        migrations.AddField(
            model_name="creditpack",
            name="apple_product_id",
            field=models.CharField(
                default="", max_length=255, unique=True
            ),
            preserve_default=False,
        ),
        migrations.RemoveField(
            model_name="subscription",
            name="stripe_customer_id",
        ),
        migrations.RemoveField(
            model_name="subscription",
            name="stripe_subscription_id",
        ),
        migrations.AddField(
            model_name="subscription",
            name="apple_original_transaction_id",
            field=models.CharField(default="", max_length=255, unique=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="subscription",
            name="apple_product_id",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="subscription",
            name="apple_environment",
            field=models.CharField(
                choices=[("Sandbox", "Sandbox"), ("Production", "Production")],
                default="Production",
                max_length=20,
            ),
        ),
        migrations.RemoveField(
            model_name="transaction",
            name="stripe_payment_intent_id",
        ),
        migrations.AddField(
            model_name="transaction",
            name="apple_transaction_id",
            field=models.CharField(blank=True, db_index=True, max_length=255),
        ),
    ]
