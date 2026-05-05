from django.db import migrations


DISABLED_KEYS = [
    "profile_banner",
    "tour_start_interstitial",
    "rewarded_credits",
]


def disable_unused_placements(apps, schema_editor):
    AdPlacement = apps.get_model("ads", "AdPlacement")
    AdPlacement.objects.filter(key__in=DISABLED_KEYS).update(enabled=False)


def reenable_unused_placements(apps, schema_editor):
    AdPlacement = apps.get_model("ads", "AdPlacement")
    AdPlacement.objects.filter(key__in=DISABLED_KEYS).update(enabled=True)


class Migration(migrations.Migration):
    dependencies = [
        ("ads", "0003_seed_default_placements"),
    ]

    operations = [
        migrations.RunPython(
            disable_unused_placements, reverse_code=reenable_unused_placements
        ),
    ]
