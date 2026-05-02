from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ai_content", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="generationjob",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Pending"),
                    ("RUNNING", "Running"),
                    ("SUCCESS", "Success"),
                    ("FAILED", "Failed"),
                    ("CANCELLED", "Cancelled"),
                ],
                default="PENDING",
                max_length=16,
            ),
        ),
        migrations.AddIndex(
            model_name="generationjob",
            index=models.Index(
                fields=["creator", "status", "created_at"],
                name="ai_job_user_status_created",
            ),
        ),
        migrations.AddIndex(
            model_name="generationjob",
            index=models.Index(
                fields=["creator", "status", "updated_at"],
                name="ai_job_user_status_updated",
            ),
        ),
    ]
