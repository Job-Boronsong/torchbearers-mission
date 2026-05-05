from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core import views

urlpatterns = [
    path("admin/", admin.site.urls),

    # Django auth (password reset, change, etc.)
    path("accounts/", include("django.contrib.auth.urls")),

    # Core app (homepage, volunteer, etc.)
    path("", include("core.urls")),

    # CKEditor 5 (REQUIRED for admin editor)
    path("ckeditor5/", include("django_ckeditor_5.urls")),

    path('ckeditor/', include('ckeditor_uploader.urls')),

    # Donate page
    path("donate/", views.donate_page, name="donate"),

    # REST API for React frontend
    path("api/", include("core.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

