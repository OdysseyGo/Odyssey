from django.db import migrations


DEFAULT_PLACEMENTS = [
    {
        "key": "profile_banner",
        "description": "Banner at bottom of profile screen",
        "ad_format": "BANNER",
        "reward_type": "NONE",
        "reward_amount": 0,
        "frequency_cap_per_day": 0,
        "min_seconds_between": 0,
        "enabled": True,
    },
    {
        "key": "tour_start_interstitial",
        "description": "Interstitial shown before tour begins",
        "ad_format": "INTERSTITIAL",
        "reward_type": "NONE",
        "reward_amount": 0,
        "frequency_cap_per_day": 3,
        "min_seconds_between": 60,
        "enabled": True,
    },
    {
        "key": "tour_complete_interstitial",
        "description": "Interstitial shown after tour completion",
        "ad_format": "INTERSTITIAL",
        "reward_type": "NONE",
        "reward_amount": 0,
        "frequency_cap_per_day": 0,
        "min_seconds_between": 0,
        "enabled": True,
    },
    {
        "key": "rewarded_credits",
        "description": "Watch ad to earn credits",
        "ad_format": "REWARDED",
        "reward_type": "CREDITS",
        "reward_amount": 50,
        "frequency_cap_per_day": 5,
        "min_seconds_between": 30,
        "enabled": True,
    },
    {
        "key": "rewarded_ai_slot",
        "description": "Watch ad to earn a free AI tour generation",
        "ad_format": "REWARDED",
        "reward_type": "AI_SLOT",
        "reward_amount": 1,
        "frequency_cap_per_day": 2,
        "min_seconds_between": 60,
        "enabled": True,
    },
    {
        "key": "rewarded_hint",
        "description": "Watch ad to skip a puzzle step without penalty",
        "ad_format": "REWARDED",
        "reward_type": "HINT",
        "reward_amount": 1,
        "frequency_cap_per_day": 5,
        "min_seconds_between": 30,
        "enabled": True,
    },
    {
        "key": "rewarded_hint_reveal",
        "description": "Watch ad to reveal the puzzle hint text",
        "ad_format": "REWARDED",
        "reward_type": "HINT",
        "reward_amount": 1,
        "frequency_cap_per_day": 5,
        "min_seconds_between": 30,
        "enabled": True,
    },
]


def seed_placements(apps, schema_editor):
    AdPlacement = apps.get_model("ads", "AdPlacement")
    for data in DEFAULT_PLACEMENTS:
        AdPlacement.objects.get_or_create(key=data["key"], defaults=data)


def unseed_placements(apps, schema_editor):
    AdPlacement = apps.get_model("ads", "AdPlacement")
    keys = [p["key"] for p in DEFAULT_PLACEMENTS]
    AdPlacement.objects.filter(key__in=keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("ads", "0002_add_revive_reward_type"),
    ]

    operations = [
        migrations.RunPython(seed_placements, reverse_code=unseed_placements),
    ]
