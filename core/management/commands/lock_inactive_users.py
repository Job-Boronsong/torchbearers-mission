from django.core.management.base import BaseCommand
from django.utils.timezone import now
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Lock users inactive for 90 days"

    def handle(self, *args, **kwargs):
        cutoff = now() - timedelta(days=90)
        users = User.objects.filter(is_active=True, last_login__lt=cutoff)

        count = users.update(is_active=False)
        self.stdout.write(f"Locked {count} inactive users")
