from django.urls import path
from . import api_views

urlpatterns = [
    path("home/", api_views.api_home, name="api_home"),
    path("projects/", api_views.api_project_list, name="api_project_list"),
    path("projects/<slug:slug>/", api_views.api_project_detail, name="api_project_detail"),
    path("blog/", api_views.api_blog_list, name="api_blog_list"),
    path("blog/<slug:slug>/", api_views.api_blog_detail, name="api_blog_detail"),
    path("about/", api_views.api_about, name="api_about"),
    path("footer/", api_views.api_footer, name="api_footer"),
    path("contact/", api_views.api_contact, name="api_contact"),
    path("volunteer/", api_views.api_volunteer, name="api_volunteer"),
    path("newsletter/subscribe/", api_views.api_newsletter_subscribe, name="api_newsletter_subscribe"),
    path("newsletter/unsubscribe/<uuid:token>/", api_views.api_newsletter_unsubscribe, name="api_newsletter_unsubscribe"),
    path("stats/", api_views.api_stats, name="api_stats"),
]
