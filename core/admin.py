from django.contrib import admin
from django.utils.html import format_html
from adminsortable2.admin import SortableAdminMixin

from .models import (
    MissionVision,
    Project,
    BlogPost,
    Volunteer,
    ContactMessage,
    FooterContent,
    TeamMember,
    CarouselSlide,
)

# =========================
# ADMIN BRANDING
# =========================
admin.site.site_header = "Torchbearers Missions Admin"
admin.site.site_title = "Torchbearers Admin Portal"
admin.site.index_title = "Welcome to Torchbearers Missions Dashboard"


# =========================
# VOLUNTEERS
# =========================
@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "created_at")
    list_filter = ("created_at",)


# =========================
# PROJECTS
# =========================
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("title",)
    prepopulated_fields = {"slug": ("title",)}


# =========================
# BLOG POSTS
# =========================
@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "is_published", "created_at")
    list_filter = ("is_published", "created_at")
    search_fields = ("title", "content")
    prepopulated_fields = {"slug": ("title",)}


# =========================
# CONTACT MESSAGES
# =========================
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("name", "email", "subject")
    readonly_fields = ("created_at",)


# =========================
# MISSION & VISION (SINGLE ENTRY)
# =========================
@admin.register(MissionVision)
class MissionVisionAdmin(admin.ModelAdmin):
    readonly_fields = ("updated_at",)

    def has_add_permission(self, request):
        # Allow only ONE record
        return not MissionVision.objects.exists()

# =========================
# TEAM MEMBERS
# =========================
@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "is_active")
    list_editable = ("is_active",)
    search_fields = ("name", "role")


# =========================
# FOOTER CONTENT
# =========================
@admin.register(FooterContent)
class FooterContentAdmin(admin.ModelAdmin):
    list_display = ("email", "phone", "whatsapp")


# =========================
# HERO CAROUSEL
# =========================
@admin.register(CarouselSlide)
class CarouselSlideAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("image_preview", "title", "is_active")
    list_editable = ("is_active",)
    readonly_fields = ("image_preview",)
    ordering = ("order",)

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:80px; border-radius:6px;" />',
                obj.image.url,
            )
        return "No Image"

    image_preview.short_description = "Preview"
