from django.urls import path, reverse
from django.shortcuts import render, redirect, get_object_or_404
import csv
from datetime import datetime
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import admin, messages
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.html import format_html
from django.utils.html import mark_safe
from django.utils.html import escape
from django.utils.timezone import now
from django.utils import timezone

from adminsortable2.admin import SortableAdminMixin

from .models import (
    MissionVision,
    Project,
    BlogPost,
    Volunteer,
    Donation,
    ContactMessage,
    Newsletter,
    NewsletterSubscriber,
    NewsletterOpen, NewsletterClick,
    FooterContent,
    TeamMember,
    WhoWeAre,
    Article,
    CarouselSlide,
    LoginAudit,
)

from django.contrib.admin import AdminSite

class TorchbearersAdminSite(AdminSite):
    site_header = "Torchbearers Missions Admin"
    site_title = "Torchbearers Admin Portal"
    index_title = "Welcome to Torchbearers Missions Dashboard"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "newsletter/send/<int:newsletter_id>/",
                self.admin_view(send_newsletter_select_subscribers),
                name="send_newsletter_select_subscribers",
            ),
        ]
        return custom_urls + urls
torchbearers_admin_site = TorchbearersAdminSite(name="torchbearers_admin")


# =====================================================
# ADMIN BRANDING
# =====================================================
admin.site.site_header = "Torchbearers Missions Admin"
admin.site.site_title = "Torchbearers Admin Portal"
admin.site.index_title = "Welcome to Torchbearers Missions Dashboard"


# =====================================================
# MISSION & VISION
# =====================================================
@admin.register(MissionVision)
class MissionVisionAdmin(admin.ModelAdmin):
    list_display = ("__str__", "updated_at")
    fields = ("hero_image", "vision_and_purpose", "statement_of_faith")


# =====================================================
# WHO WE ARE
# =====================================================
@admin.register(WhoWeAre)
class WhoWeAreAdmin(admin.ModelAdmin):
    list_display = ("title", "updated_at")


# =====================================================
# DONATIONS
# =====================================================
@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ("donor_name", "email", "amount", "payment_method", "is_verified", "created_at")
    list_filter = ("payment_method", "is_verified", "created_at")
    search_fields = ("donor_name", "email", "transaction_id")
    readonly_fields = ("transaction_id", "created_at")


# =====================================================
# ARTICLES
# =====================================================
@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("title", "author")


# =====================================================
# VOLUNTEERS
# =====================================================
@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "created_at")
    list_filter = ("created_at",)


# =====================================================
# PROJECTS
# =====================================================
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("title",)
    prepopulated_fields = {"slug": ("title",)}


# =====================================================
# BLOG POSTS
# =====================================================
@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author",
        "is_published",
        "created_at",
        "feature_image_preview",
    )
    list_filter = ("is_published", "created_at", "author")
    search_fields = ("title", "content")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("feature_image_preview",)

    fieldsets = (
        ("Content", {
            "fields": ("title", "slug", "author", "content", "feature_image")
        }),
        ("SEO", {
            "fields": ("seo_title", "seo_description"),
        }),
        ("Publishing", {
            "fields": ("is_published",),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.author:
            obj.author = request.user
        super().save_model(request, obj, form, change)

    def feature_image_preview(self, obj):
        if obj.feature_image:
            return format_html(
                '<img src="{}" style="max-height:120px;border-radius:6px;" />',
                obj.feature_image.url,
            )
        return "—"


# =====================================================
# CONTACT MESSAGES
# =====================================================
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("name", "email", "subject")


# =====================================================
# TEAM MEMBERS
# =====================================================
@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "order", "is_active")
    list_editable = ("order", "is_active")


# =====================================================
# FOOTER CONTENT
# =====================================================
@admin.register(FooterContent)
class FooterContentAdmin(admin.ModelAdmin):
    list_display = ("email", "phone", "whatsapp")


# =====================================================
# CAROUSEL SLIDES
# =====================================================
@admin.register(CarouselSlide)
class CarouselSlideAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("image_preview", "title", "is_active")
    list_editable = ("is_active",)
    readonly_fields = ("image_preview",)
    ordering = ("order",)

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:80px;border-radius:6px;" />',
                obj.image.url,
            )
        return "No Image"


# =====================================================
# LOGIN AUDITS
# =====================================================
@admin.register(LoginAudit)
class LoginAuditAdmin(admin.ModelAdmin):
    list_display = ("user", "ip_address", "successful", "timestamp")
    list_filter = ("successful", "timestamp")



# =====================================================
# EXPORT CSV ACTION
# =====================================================
@admin.action(description="Export active subscribers (CSV)")
def export_newsletter_csv(modeladmin, request, queryset):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="newsletter_subscribers.csv"'

    writer = csv.writer(response)
    writer.writerow(["Email", "Subscribed At"])

    for sub in queryset.filter(is_active=True):
        writer.writerow([sub.email, sub.subscribed_at])

    return response


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "subscribed_at", "is_active")
    search_fields = ("email",)
    list_filter = ("is_active",)
    actions = [export_newsletter_csv]


# =====================================================
# NEWSLETTER ADMIN
# =====================================================
@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "subject",
        "week_number",
        "created_at",
        "sent",
        "open_count",
        "click_count",
    )

    readonly_fields = ("created_at", "preview")
    fields = ("title", "subject", "week_number", "body", "preview")
    actions = ("send_newsletter_action",)

    # =========================
    # PREVIEW
    # =========================
    def preview(self, obj):
        if not obj.pk:
            return "Save the newsletter to preview it."

        html = render_to_string(
            "newsletter/email_wrapper.html",
            {
                "subject": obj.subject,
                "body": obj.body,
                "first_name": "Friend",
                "week_number": obj.week_number,
                "year": timezone.now().year,
                "unsubscribe_url": "#",
                "first_name": "Subscriber",

                "unsubscribe_url": "#",
            }
        )

        return format_html(
            '<iframe style="width:100%;height:500px;border:1px solid #ccc;" srcdoc="{}"></iframe>',
            html,
        )

    preview.short_description = "Newsletter Preview"

    # =========================
    # ACTION BUTTON
    # =========================
    def send_newsletter_action(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(
                request,
                "Select exactly ONE newsletter.",
                level=messages.ERROR,
            )
            return

        newsletter = queryset.first()
        return redirect("admin:newsletter_send", newsletter.id)

    send_newsletter_action.short_description = "Send newsletter"

    # =========================
    # CUSTOM URL
    # =========================
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "send/<int:newsletter_id>/",
                self.admin_site.admin_view(self.send_newsletter_view),
                name="newsletter_send",
            ),
        ]
        return custom_urls + urls

    # =========================
    # SEND VIEW (OPTION A CORE)
    # =========================
    def send_newsletter_view(self, request, newsletter_id):
        newsletter = get_object_or_404(Newsletter, id=newsletter_id)
        subscribers = NewsletterSubscriber.objects.filter(is_active=True)

        if request.method == "POST":
            selected_ids = request.POST.getlist("subscribers")

            if not selected_ids:
                self.message_user(request, "Select at least one subscriber.", messages.ERROR)
                return redirect(request.path)

            sent = 0
            for sub in subscribers.filter(id__in=selected_ids):

                unsubscribe_url = request.build_absolute_uri(
                    reverse("core:newsletter_unsubscribe", args=[sub.unsubscribe_token])
                )

                open_pixel = request.build_absolute_uri(
                    reverse("core:newsletter_open_pixel", args=[newsletter.id, sub.id])
                )

                # 🔑 THIS IS OPTION A
                html_body = render_to_string(
                    "newsletter/email_wrapper.html",
                    {
                        "subject": newsletter.subject,
                        "body": newsletter.body,
                        "first_name": getattr(sub, "first_name", "Friend"),
                        "week_number": newsletter.week_number,
                        "year": timezone.now().year,
                        "unsubscribe_url": unsubscribe_url,
                        "first_name": sub.first_name,
                        "week_number": newsletter.week_number,
                        "year": timezone.now().year,

                        "unsubscribe_url": unsubscribe_url,
                    }
                ) + f'<img src="{open_pixel}" width="1" height="1" style="display:none;">'

                email = EmailMultiAlternatives(
                    subject=newsletter.subject,
                    body="Please view this email in an HTML-compatible client.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[sub.email],
                )

                email.attach_alternative(html_body, "text/html")
                email.extra_headers = {
                    "List-Unsubscribe": f"<{unsubscribe_url}>"
                }

                email.send()
                sent += 1

            newsletter.sent = True
            newsletter.save(update_fields=["sent"])

            self.message_user(
                request,
                f"Newsletter sent to {sent} subscribers.",
                messages.SUCCESS,
            )
            return redirect("admin:core_newsletter_changelist")

        return render(
            request,
            "admin/newsletter_select_subscribers.html",
            {
                "newsletter": newsletter,
                "subscribers": subscribers,
            },
        )

    # =========================
    # ANALYTICS
    # =========================
    def open_count(self, obj):
        return NewsletterOpen.objects.filter(newsletter=obj).count()

    def click_count(self, obj):
        return NewsletterClick.objects.filter(newsletter=obj).count()

    open_count.short_description = "Opens"
    click_count.short_description = "Clicks"
