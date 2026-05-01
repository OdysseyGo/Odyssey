from django.db import migrations
from django.db.models import Q


def backfill_cover_images(apps, schema_editor):
    Tour = apps.get_model("tours", "Tour")
    TourStep = apps.get_model("tours", "TourStep")

    tours_without_cover = Tour.objects.filter(
        Q(cover_image="") | Q(cover_image__isnull=True)
    )
    for tour in tours_without_cover.iterator():
        first_step_with_image = (
            TourStep.objects.filter(tour_id=tour.id, image__isnull=False)
            .exclude(image="")
            .order_by("order", "id")
            .first()
        )
        if not first_step_with_image or not first_step_with_image.image:
            continue

        tour.cover_image = first_step_with_image.image
        tour.save(update_fields=["cover_image"])


class Migration(migrations.Migration):
    dependencies = [
        ("tours", "0015_merge_20260426_1207"),
    ]

    operations = [
        migrations.RunPython(backfill_cover_images, migrations.RunPython.noop),
    ]
