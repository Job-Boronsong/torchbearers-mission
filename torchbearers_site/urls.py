from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from core import views
from core.views import ForcedPasswordChangeView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Custom password change (MUST come before accounts/ include so reverse("password_change") hits this)
    path(
        "accounts/password_change/",
        ForcedPasswordChangeView.as_view(
            template_name="registration/password_change_form.html"
        ),
        name="password_change",
    ),
    path(
        "accounts/password_change/done/",
        auth_views.PasswordChangeDoneView.as_view(
            template_name="registration/password_change_done.html"
        ),
        name="password_change_done",
    ),

    # Django auth (password reset, login/logout, etc.)
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

