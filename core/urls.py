from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),

    path('projects/', views.project_list, name='project_list'),
    path('projects/<slug:slug>/', views.project_detail, name='project_detail'),

    path("blog/", views.blog_list, name="blog_list"),  # ✅ correct
    path("blog/<slug:slug>/", views.blog_detail, name="blog_detail"),
    
    path('donation/verify/', views.verify_donation, name='verify_donation'),
    path("register-volunteer/", views.register_volunteer, name="register_volunteer"),

]
