from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaction',
            name='transaction_type',
            field=models.CharField(
                choices=[
                    ('PURCHASE', 'Credit Purchase'),
                    ('TOUR_UNLOCK', 'Tour Unlock'),
                    ('CREATOR_EARNING', 'Creator Earning'),
                    ('SUBSCRIPTION_GRANT', 'Subscription Grant'),
                    ('REFUND', 'Refund'),
                    ('ADMIN_ADJUSTMENT', 'Admin Adjustment'),
                ],
                max_length=30,
            ),
        ),
    ]
