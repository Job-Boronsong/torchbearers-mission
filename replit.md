# Torchbearers Mission Incorporated

A website for Torchbearers Mission Incorporated, a Christian missions organization focused on evangelism, discipleship, humanitarian outreach, and advancement of God's Kingdom.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript (`frontend/` directory), served on port 5000
- **Backend**: Django 6.0 REST API, served on port 8000 via gunicorn
- **Database**: SQLite (dev) / PostgreSQL (prod via psycopg2-binary)
- **Static Files**: WhiteNoise (Django side, for media/admin)
- **Cache**: PyMemcacheCache using a fake in-process memcached server (`fake_memcached.py`) — or Redis if `REDIS_URL` is set
- **Admin**: Django admin with CKEditor 5 for rich text editing
- **Authentication**: django-axes (brute-force lockout), django-otp (OTP support)
- **Rate Limiting**: django-ratelimit
- **CORS**: django-cors-headers (allows React dev server to call Django API)

## Key Files

- `manage.py` — Django management entry point
- `torchbearers_site/settings.py` — Main Django settings
- `torchbearers_site/urls.py` — Root URL config (includes `/api/` routes)
- `torchbearers_site/wsgi.py` — WSGI app
- `fake_memcached.py` — In-process memcached protocol server for ratelimit support
- `start.sh` — Startup script (runs fake_memcached, migrate, collectstatic, Django on 8000, React/Vite on 5000)
- `core/models.py` — All data models: BlogPost, Project, Volunteer, Donation, Newsletter, etc.
- `core/views.py` — Django template views (legacy, kept for Django admin flows)
- `core/api_views.py` — JSON API views for the React frontend
- `core/api_urls.py` — API URL routes (mounted at `/api/`)
- `frontend/` — React + Vite frontend
- `frontend/src/api.ts` — Axios API client with typed interfaces
- `frontend/src/App.tsx` — React Router routes
- `frontend/src/components/Layout.tsx` — Shared Navbar + Footer
- `frontend/src/pages/` — All page components

## API Endpoints

All mounted at `/api/`:

| Method | Path | Description |
|---|---|---|
| GET | `/api/home/` | Carousel slides, featured projects/blogs, stats |
| GET | `/api/projects/` | All active projects |
| GET | `/api/projects/:slug/` | Single project detail |
| GET | `/api/blog/` | All published posts |
| GET | `/api/blog/:slug/` | Single blog post |
| GET | `/api/about/` | Mission/vision, who we are, team |
| GET | `/api/footer/` | Footer contact info |
| GET | `/api/stats/` | Donation/volunteer/project counts |
| POST | `/api/contact/` | Submit contact form |
| POST | `/api/volunteer/` | Register as volunteer |
| POST | `/api/newsletter/subscribe/` | Newsletter signup |
| GET | `/api/newsletter/unsubscribe/:token/` | Unsubscribe by UUID token |

## React Frontend Pages

| Route | Page |
|---|---|
| `/` | Home — carousel, featured projects/blogs, stats |
| `/about` | About — mission/vision, team |
| `/projects` | Projects list |
| `/projects/:slug` | Project detail |
| `/blog` | Blog list |
| `/blog/:slug` | Blog detail |
| `/contact` | Contact form |
| `/donate` | Donation info page |
| `/volunteer` | Volunteer signup |
| `/newsletter/unsubscribe/:token` | Newsletter unsubscribe |

## Running the App

The app starts via `bash start.sh` which:
1. Starts fake memcached on `127.0.0.1:11211`
2. Runs Django migrations
3. Collects static files
4. Starts gunicorn (Django) on `0.0.0.0:8000`
5. Starts Vite dev server (React) on `0.0.0.0:5000`

Vite proxies `/api/` and `/media/` requests to `http://localhost:8000`.

## Environment Variables

- `SECRET_KEY` — Django secret key (defaults to `unsafe-dev-key`)
- `REDIS_URL` — Optional Redis URL (falls back to in-process memcached if not set)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` — Email config
- `FLUTTERWAVE_PUBLIC_KEY`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_ENCRYPTION_KEY` — Payment keys (optional)
- `CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET` — Cloudflare Turnstile keys (optional)

## Features

- Home page with hero carousel, featured projects and blog posts, stats section
- Projects listing and detail pages (HTML content from CKEditor)
- Blog listing and detail pages (HTML content from CKEditor)
- Contact form (POST to Django API, with email notifications)
- Donation information page
- Volunteer registration form
- Newsletter subscription / unsubscription (UUID token-based)
- Django admin panel at `/admin/` for content management

## Deployment

Configured for autoscale deployment:
- Run command: `bash start.sh`
- Preview port: 5000 (React frontend)
- Django backend: port 8000 (internal)
