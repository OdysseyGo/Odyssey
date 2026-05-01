from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.ai_content.errors import STALE_GENERATION_JOB_ERROR
from apps.ai_content.models import GenerationJob


class Command(BaseCommand):
    help = "Mark stale pending or running AI generation jobs as failed."

    def add_arguments(self, parser):
        parser.add_argument(
            "--minutes",
            type=int,
            default=getattr(settings, "AI_GENERATION_STALE_JOB_MINUTES", 30),
            help="Fail pending or running jobs older than this many minutes.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report how many rows would be updated without updating them.",
        )

    def handle(self, *args, **options):
        minutes = options["minutes"]
        if minutes < 1:
            self.stderr.write("minutes must be at least 1")
            return

        cutoff = timezone.now() - timedelta(minutes=minutes)
        queryset = GenerationJob.objects.filter(
            status__in=[GenerationJob.PENDING, GenerationJob.RUNNING],
            updated_at__lt=cutoff,
        )
        count = queryset.count()

        if options["dry_run"]:
            self.stdout.write(
                f"Would fail {count} stale generation job(s) older than "
                f"{minutes} minute(s)."
            )
            return

        queryset.update(
            status=GenerationJob.FAILED,
            progress_label="",
            error=STALE_GENERATION_JOB_ERROR,
            updated_at=timezone.now(),
        )
        self.stdout.write(
            f"Failed {count} stale generation job(s) older than {minutes} minute(s)."
        )
