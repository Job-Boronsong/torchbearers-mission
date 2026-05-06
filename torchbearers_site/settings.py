from pathlib import Path
import os
from dotenv import load_dotenv

# --------------------------------------------------
# BASE
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# --------------------------------------------------
# CORE
# --------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "unsafe-dev-key")
DEBUG = True

ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "209.74.88.43",
    "torchbearersmission.org",
    "www.torchbearersmission.org",
    "torchbearersmissions.org",
    "www.torchbearersmissions.org",
    os.getenv("REPLIT_DEV_DOMAIN", ""),
    ".replit.dev",
    ".replit.app",
    ".janeway.replit.dev",
]

# --------------------------------------------------
# SECURITY (DEV SAFE)
# --------------------------------------------------
SECURE_SSL_REDIRECT = False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CSRF_TRUSTED_ORIGINS = [
    "https://torchbearersmission.org",
    "https://www.torchbearersmission.org",
    "https://torchbearersmissions.org",
    "https://www.torchbearersmissions.org",
    "https://*.replit.dev",
    "https://*.replit.app",
    "https://*.janeway.replit.dev",
]

# --------------------------------------------------
# APPS
# --------------------------------------------------
INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "adminsortable2",
    "core",
    "django_ckeditor_5",
    "ckeditor",
    "ckeditor_uploader",

    "axes",
    "django_otp",
    "django_ratelimit",
    "rest_framework",
    "corsheaders",
]

# --------------------------------------------------
# AUTH
# --------------------------------------------------
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# --------------------------------------------------
# MIDDLEWARE
# --------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "core.middleware.ForcePasswordChangeMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware",
]

# --------------------------------------------------
# URL / TEMPLATES
# --------------------------------------------------
ROOT_URLCONF = "torchbearers_site.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "core" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "core.context_processors.footer_context",
                "core.context_processors.payment_keys",
            ],
        },
    },
]


TEMPLATES[0]["OPTIONS"]["context_processors"] += [
    "core.context_processors.turnstile_keys",
]

WSGI_APPLICATION = "torchbearers_site.wsgi.application"

# --------------------------------------------------
# DATABASE
# --------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# --------------------------------------------------
# PASSWORDS
# --------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --------------------------------------------------
# I18N
# --------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --------------------------------------------------
# STATIC / MEDIA
# --------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --------------------------------------------------
# CKEDITOR 5 (ONLY)
# --------------------------------------------------
CKEDITOR_UPLOAD_PATH = "uploads/"

CKEDITOR_5_CONFIGS = {
    "default": {
        "toolbar": [
            "heading",
            "|",
            "bold", "italic", "link",
            "bulletedList", "numberedList",
            "|",
            "blockQuote",
            "insertTable",
            "imageUpload",
            "|",
            "undo", "redo",
        ],
        "image": {
            "toolbar": [
                "imageTextAlternative",
                "imageStyle:full",
                "imageStyle:side",
            ]
        },
        "upload_url": "/ckeditor5/upload/",

        "table": {
            "contentToolbar": [
                "tableColumn",
                "tableRow",
                "mergeTableCells",
            ]
        },
    }
}

CKEDITOR_IMAGE_BACKEND = "pillow"

# --------------------------------------------------
# EMAIL
# --------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.zoho.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 465))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "False") == "True"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "True") == "True"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "info@torchbearersmission.org")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Torchbearers Mission <info@torchbearersmission.org>")

# --------------------------------------------------
# PAYMENTS
# --------------------------------------------------
FLUTTERWAVE_PUBLIC_KEY = os.getenv("FLUTTERWAVE_PUBLIC_KEY")
FLUTTERWAVE_SECRET_KEY = os.getenv("FLUTTERWAVE_SECRET_KEY")
FLUTTERWAVE_ENCRYPTION_KEY = os.getenv("FLUTTERWAVE_ENCRYPTION_KEY")

# --------------------------------------------------
# TURNSTILE
# --------------------------------------------------
CLOUDFLARE_TURNSTILE_SITE_KEY = os.getenv("CLOUDFLARE_TURNSTILE_SITE_KEY")
CLOUDFLARE_TURNSTILE_SECRET = os.getenv("CLOUDFLARE_TURNSTILE_SECRET")

# --------------------------------------------------
# RATELIMIT (PROXY SAFE)
# --------------------------------------------------
RATELIMIT_IP_META_KEY = "HTTP_X_FORWARDED_FOR"

# --------------------------------------------------
# AXES
# --------------------------------------------------
AXES_FAILURE_LIMIT = 5
AXES_LOCK_OUT_AT_FAILURE = True
AXES_COOLOFF_TIME = 1
AXES_RESET_ON_SUCCESS = True

# --------------------------------------------------
# SESSIONS
# --------------------------------------------------
SESSION_COOKIE_AGE = 15 * 60
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

LOGIN_URL = "/admin/login/"
LOGIN_REDIRECT_URL = "/admin/"
LOGOUT_REDIRECT_URL = "/admin/login/"


# --------------------------------------------------
# CORS (for React frontend dev server)
# --------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.replit\.dev$",
    r"^https://.*\.replit\.app$",
    r"^https://.*\.janeway\.replit\.dev$",
]

REDIS_URL = os.getenv("REDIS_URL", "")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            }
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.memcached.PyMemcacheCache",
            "LOCATION": "127.0.0.1:11211",
        }
    }

# --------------------------------------------------
# JAZZMIN — Admin UI
# --------------------------------------------------
JAZZMIN_SETTINGS = {
    "site_title": "Torchbearers Admin",
    "site_header": "Torchbearers Mission",
    "site_brand": "Torchbearers Mission",
    "welcome_sign": "Welcome to Torchbearers Mission Admin",
    "copyright": "Torchbearers Mission Incorporated",

    "search_model": ["core.BlogPost", "core.Project"],

    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "View Site", "url": "/", "new_window": True},
    ],

    "usermenu_links": [
        {"name": "View Site", "url": "/", "new_window": True},
    ],

    "show_sidebar": True,
    "navigation_expanded": True,

    "icons": {
        "auth":                     "fas fa-users-cog",
        "auth.user":                "fas fa-user",
        "auth.Group":               "fas fa-users",
        "core.BlogPost":            "fas fa-newspaper",
        "core.Project":             "fas fa-hands-helping",
        "core.TeamMember":          "fas fa-user-tie",
        "core.DirectorMessage":     "fas fa-comment-alt",
        "core.Donation":            "fas fa-hand-holding-usd",
        "core.Volunteer":           "fas fa-heart",
        "core.ContactMessage":      "fas fa-envelope",
        "core.Newsletter":          "fas fa-mail-bulk",
        "core.NewsletterSubscriber":"fas fa-users",
        "core.FooterContent":       "fas fa-shoe-prints",
        "core.CarouselSlide":       "fas fa-images",
        "core.LoginAudit":          "fas fa-shield-alt",
    },

    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",

    "related_modal_active": True,
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,

    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}
