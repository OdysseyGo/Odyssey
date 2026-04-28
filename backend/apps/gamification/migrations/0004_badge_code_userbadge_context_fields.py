from django.db import migrations, models
import django.db.models.deletion


def backfill_badge_codes(apps, schema_editor):
    Badge = apps.get_model("gamification", "Badge")
    code_by_name = {
        "City Gold": "CITY_GOLD",
        "City Silver": "CITY_SILVER",
        "City Bronze": "CITY_BRONZE",
        "XP Explorer I": "XP_100",
        "XP Explorer II": "XP_500",
        "XP Explorer III": "XP_1000",
    }
    for badge in Badge.objects.all():
        if badge.code:
            continue
        fallback = (
            badge.name.upper().replace(" ", "_").replace("-", "_")[:64]
            if badge.name
            else ""
        )
        badge.code = code_by_name.get(badge.name) or fallback or None
        badge.save(update_fields=["code"])


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0015_merge_20260426_1207"),
        ("gamification", "0003_picturecompareconfig"),
    ]

    operations = [
        migrations.AddField(
            model_name="badge",
            name="code",
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="userbadge",
            name="city",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="userbadge",
            name="country_code",
            field=models.CharField(blank=True, default="ZZ", max_length=2),
        ),
        migrations.AddField(
            model_name="userbadge",
            name="mistake_count",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="userbadge",
            name="source_tour",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="awarded_badges",
                to="tours.tour",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="userbadge",
            unique_together=set(),
        ),
        migrations.RunPython(backfill_badge_codes, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="userbadge",
            constraint=models.UniqueConstraint(
                fields=("user", "badge", "city", "country_code"),
                name="uniq_user_badge_city_country",
            ),
        ),
    ]
