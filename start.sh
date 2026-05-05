#!/bin/bash
set -e

export DJANGO_SETTINGS_MODULE=torchbearers_site.settings

# Start fake memcached for ratelimit if no Redis configured
if [ -z "$REDIS_URL" ]; then
    python fake_memcached.py &
    sleep 0.5
fi

python manage.py migrate --skip-checks
python manage.py collectstatic --noinput --skip-checks

# Create default superuser if none exists, and clear the forced password-change flag
python manage.py shell -c "
from django.contrib.auth import get_user_model
from core.models import UserProfile
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    user = User.objects.create_superuser('admin', 'admin@torchbearers.org', 'admin1234')
    UserProfile.objects.filter(user=user).update(must_change_password=False)
    print('Default superuser created: admin / admin1234')
else:
    # Make sure existing superusers are never stuck in the redirect loop
    User.objects.filter(is_superuser=True).select_related('userprofile')
    for u in User.objects.filter(is_superuser=True):
        UserProfile.objects.filter(user=u).update(must_change_password=False)
    print('Superuser already exists — skipping creation.')
"

# Start Django backend on port 8000
gunicorn torchbearers_site.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 120 \
    --log-level info &

# Start React frontend on port 5000
cd frontend && npm run dev
