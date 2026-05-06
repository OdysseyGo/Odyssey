from django.db import migrations, models


def create_default_runtime_config(apps, schema_editor):
    UserRuntimeConfig = apps.get_model("users", "UserRuntimeConfig")
    UserRuntimeConfig.objects.get_or_create(singleton_id=1)


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0015_user_is_review_account"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserRuntimeConfig",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "singleton_id",
                    models.PositiveSmallIntegerField(
                        default=1,
                        editable=False,
                        unique=True,
                    ),
                ),
                ("default_reviewer", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.RunPython(
            create_default_runtime_config,
            migrations.RunPython.noop,
        ),
    ]
