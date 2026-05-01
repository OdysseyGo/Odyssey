from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.ai_content.models import GenerationJob


class Command(BaseCommand):
    help = "Delete old terminal AI generation jobs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Delete successful or failed jobs older than this many days.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report how many rows would be deleted without deleting them.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        if days < 1:
            self.stderr.write("days must be at least 1")
            return

        cutoff = timezone.now() - timedelta(days=days)
        queryset = GenerationJob.objects.filter(
            status__in=[GenerationJob.SUCCESS, GenerationJob.FAILED],
            updated_at__lt=cutoff,
        )
        count = queryset.count()

        if options["dry_run"]:
            self.stdout.write(
                f"Would delete {count} generation job(s) older than {days} day(s)."
            )
            return

        queryset.delete()
        self.stdout.write(
            f"Deleted {count} generation job(s) older than {days} day(s)."
        )
