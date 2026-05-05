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

# Create default superuser if none exists
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@torchbearers.org', 'admin1234')
    print('Default superuser created: admin / admin1234')
else:
    print('Superuser already exists — skipping.')
"

# Start Django backend on port 8000
gunicorn torchbearers_site.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 120 \
    --log-level info &

# Start React frontend on port 5000
cd frontend && npm run dev
