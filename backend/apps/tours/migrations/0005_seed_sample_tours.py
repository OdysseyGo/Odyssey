from django.db import migrations


def seed_tours(apps, schema_editor):
    User = apps.get_model("users", "User")
    Tour = apps.get_model("tours", "Tour")

    # Ensure a creator exists
    username = "seed_creator"
    creator = User.objects.filter(username=username).first()
    if creator is None:
        creator = User.objects.create_user(
            username=username, 
            email="seed_creator@example.com", 
            password="seed1234"
        )
        creator.is_staff = True
        creator.user_type = getattr(User, "CREATOR", 3)
        creator.save()

    # Avoid duplicating seeds: only create if fewer than 20 exist
    existing = Tour.objects.filter(title__startswith="Sample Tour ").count()
    if existing >= 20:
        return

    tour_types = ["STORY", "PUZZLE", "HYBRID"]
    difficulties = ["EASY", "MEDIUM", "HARD"]
    categories = [
        "History",
        "Culture",
        "Food",
        "Art",
        "Nature",
        "Science",
        "Architecture",
        "Music",
        "Literature",
        "Mystery",
    ]
    cities = [
        "Istanbul",
        "Paris",
        "London",
        "Rome",
        "Barcelona",
        "Berlin",
        "Amsterdam",
        "Prague",
        "Vienna",
        "Lisbon",
    ]

    # Create up to 20 published sample tours
    for i in range(1, 21):
        title = f"Sample Tour {i}"
        if Tour.objects.filter(title=title).exists():
            continue

        Tour.objects.create(
            title=title,
            description="An example tour for development and testing.",
            creator=creator,
            tour_type=tour_types[(i - 1) % len(tour_types)],
            category=categories[(i - 1) % len(categories)],
            difficulty=difficulties[(i - 1) % len(difficulties)],
            duration_minutes=30 + (i * 5) % 120,
            is_premium=False,
            city=cities[(i - 1) % len(cities)],
            status="PUBLISHED",
        )


def unseed_tours(apps, schema_editor):
    # Remove only the seeded sample tours
    Tour = apps.get_model("tours", "Tour")
    Tour.objects.filter(title__startswith="Sample Tour ").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0004_tour_elevation_gain_tour_is_circular_and_more"),
        ("users", "0002_rename_token_user_credit"),
    ]

    operations = [
        migrations.RunPython(seed_tours, reverse_code=unseed_tours),
    ]
