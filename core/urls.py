from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views

from . import views
from .views import ForcedPasswordChangeView

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),

    path("about/", views.about, name="about"),
    path("contact/", views.contact, name="contact"),

    # Projects
    path("projects/", views.project_list, name="project_list"),
    path("projects/<slug:slug>/", views.project_detail, name="project_detail"),

    # Blog
    path("blog/", views.blog_list, name="blog_list"),
    path("blog/<slug:slug>/", views.blog_detail, name="blog_detail"),

    # Donations & volunteers
    path("donation/verify/", views.verify_donation, name="verify_donation"),
    path("register-volunteer/", views.register_volunteer, name="register_volunteer"),

    # Password change (FORCED FLOW)
    path(
        "accounts/password/change/",
        ForcedPasswordChangeView.as_view(),
        name="password_change",
    ),
    path(
        "accounts/password/change/done/",
        auth_views.PasswordChangeDoneView.as_view(
            template_name="registration/password_change_done.html"
        ),
        name="password_change_done",
    ),

    path("newsletter/subscribe/", views.newsletter_subscribe, name="newsletter_subscribe"),
    path(
    "newsletter/unsubscribe/<uuid:token>/",
    views.newsletter_unsubscribe,
    name="newsletter_unsubscribe"
    ),

    path(
        "newsletter/open/<int:newsletter_id>/<int:subscriber_id>/",
        views.newsletter_open_pixel,
        name="newsletter_open_pixel",
    ),

    path(
    "newsletter/click/<int:newsletter_id>/<int:subscriber_id>/",
    views.newsletter_click_redirect,
    name="newsletter_click_redirect",
    ),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

