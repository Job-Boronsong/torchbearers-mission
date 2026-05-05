# Torchbearers Mission Incorporated

A Django-based website for Torchbearers Mission Incorporated, a Christian missions organization focused on evangelism, discipleship, humanitarian outreach, and advancement of God's Kingdom.

## Architecture

- **Framework**: Django 6.0
- **Database**: SQLite (dev) / PostgreSQL (prod via psycopg2-binary)
- **Static Files**: WhiteNoise (served directly by gunicorn)
- **Cache**: PyMemcacheCache using a fake in-process memcached server (`fake_memcached.py`) — or Redis if `REDIS_URL` is set
- **Admin**: Django admin with CKEditor 5 for rich text editing
- **Authentication**: django-axes (brute-force lockout), django-otp (OTP support)
- **Rate Limiting**: django-ratelimit

## Key Files

- `manage.py` — Django management entry point
- `torchbearers_site/settings.py` — Main Django settings
- `torchbearers_site/wsgi.py` — WSGI app (also starts fake memcached on startup)
- `fake_memcached.py` — In-process memcached protocol server for ratelimit support
- `start.sh` — Startup script (runs fake_memcached, migrate, collectstatic, gunicorn)
- `core/` — Main app (views, models, templates, static files, migrations)
- `core/models.py` — All models: BlogPost, Project, Volunteer, Donation, Newsletter, etc.
- `core/views.py` — All views
- `core/templates/` — Django templates

## Running the App

The app starts via `bash start.sh` which:
1. Starts fake memcached on `127.0.0.1:11211`
2. Runs `python manage.py migrate --skip-checks`
3. Runs `python manage.py collectstatic --noinput --skip-checks`
4. Starts gunicorn on `0.0.0.0:5000`

## Environment Variables

- `SECRET_KEY` — Django secret key (defaults to `unsafe-dev-key`)
- `REDIS_URL` — Optional Redis URL (falls back to in-process memcached if not set)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` — Email config
- `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_ENCRYPTION_KEY` — Payment keys
- `CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET` — Cloudflare Turnstile keys

## Features

- Home page with carousel/hero section
- Projects listing and detail pages
- Blog with rich text content (CKEditor)
- Contact form
- Donation flow (Flutterwave integration)
- Volunteer registration
- Newsletter subscription/unsubscription
- Django admin with sortable models

## Static Files

Source static files are in `core/static/`. WhiteNoise serves them from `staticfiles/` (collected).

## Deployment

Configured for autoscale deployment using gunicorn:
- Run command: `bash start.sh`
- Port: 5000
