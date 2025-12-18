from django.contrib import admin
from django.template.response import TemplateResponse
from .models import Volunteer, Project, BlogPost, ContactMessage

class AdminDashboardView(admin.AdminSite):
    site_header = "Torchbearers Missions Admin"

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}

        extra_context['stats'] = {
            'volunteers': Volunteer.objects.count(),
            'projects': Project.objects.count(),
            'blogs': BlogPost.objects.count(),
            'messages': ContactMessage.objects.filter(is_read=False).count(),
        }

        return TemplateResponse(
            request,
            "admin/dashboard.html",
            extra_context
        )

custom_admin_site = AdminDashboardView(name="custom_admin")


class CustomAdmin(admin.AdminSite):
    class Media:
        css = {
            'all': ('admin/custom.css',)
        }
