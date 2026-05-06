from django.db.models import Sum
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils.timezone import now
from datetime import timedelta
import json
import requests

from .models import (
    CarouselSlide, Project, BlogPost, MissionVision, WhoWeAre,
    FooterContent, Donation, ContactMessage, DirectorMessage,
    Volunteer, NewsletterSubscriber,
)


def _image_url(request, field):
    if field and field.name:
        return field.url  # relative path e.g. /media/carousel/img.webp — proxied by Vite
    return None


# ========================= HOME =========================
@require_GET
def api_home(request):
    slides = [
        {
            "id": s.id,
            "title": s.title,
            "subtitle": s.subtitle,
            "image": _image_url(request, s.image),
            "button_text": s.button_text,
            "button_link": s.button_link,
            "layout": s.layout,
        }
        for s in CarouselSlide.objects.filter(is_active=True).order_by("order")
    ]

    projects = [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "feature_image": _image_url(request, p.feature_image),
        }
        for p in Project.objects.filter(is_active=True).order_by("-created_at")[:3]
    ]

    blogs = [
        {
            "id": b.id,
            "title": b.title,
            "slug": b.slug,
            "feature_image": _image_url(request, b.feature_image),
            "created_at": b.created_at.isoformat(),
        }
        for b in BlogPost.objects.filter(is_published=True).order_by("-created_at")[:3]
    ]

    total_donations = Donation.objects.filter(is_verified=True).aggregate(
        total=Sum("amount")
    )["total"] or 0

    donor_count = Donation.objects.filter(is_verified=True).count()

    return JsonResponse({
        "slides": slides,
        "featured_projects": projects,
        "featured_blogs": blogs,
        "total_donations": str(total_donations),
        "donor_count": donor_count,
    })


# ========================= PROJECTS =========================
@require_GET
def api_project_list(request):
    projects = [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "feature_image": _image_url(request, p.feature_image),
            "created_at": p.created_at.isoformat(),
            "show_donate": p.show_donate,
        }
        for p in Project.objects.filter(is_active=True).order_by("-created_at")
    ]
    return JsonResponse({"projects": projects})


@require_GET
def api_project_detail(request, slug):
    try:
        p = Project.objects.get(slug=slug, is_active=True)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    return JsonResponse({
        "id": p.id,
        "title": p.title,
        "slug": p.slug,
        "description": p.description,
        "feature_image": _image_url(request, p.feature_image),
        "created_at": p.created_at.isoformat(),
        "show_donate": p.show_donate,
    })


# ========================= BLOG =========================
@require_GET
def api_blog_list(request):
    posts = [
        {
            "id": b.id,
            "title": b.title,
            "slug": b.slug,
            "feature_image": _image_url(request, b.feature_image),
            "seo_description": b.seo_description,
            "created_at": b.created_at.isoformat(),
            "author": b.author.get_full_name() if b.author else None,
        }
        for b in BlogPost.objects.filter(is_published=True).order_by("-created_at")
    ]
    return JsonResponse({"posts": posts})


@require_GET
def api_blog_detail(request, slug):
    try:
        b = BlogPost.objects.get(slug=slug, is_published=True)
    except BlogPost.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    return JsonResponse({
        "id": b.id,
        "title": b.title,
        "slug": b.slug,
        "content": b.content,
        "feature_image": _image_url(request, b.feature_image),
        "seo_title": b.seo_title,
        "seo_description": b.seo_description,
        "created_at": b.created_at.isoformat(),
        "author": b.author.get_full_name() if b.author else None,
    })


# ========================= ABOUT =========================
@require_GET
def api_about(request):
    mv = MissionVision.objects.first()
    who = WhoWeAre.objects.first()
    dm = DirectorMessage.objects.filter(is_active=True).first()
    director_message = None
    if dm:
        director_message = {
            "name": dm.name,
            "title": dm.title,
            "photo": _image_url(request, dm.photo),
            "message": dm.message,
        }

    return JsonResponse({
        "mission_vision": {
            "hero_image": _image_url(request, mv.hero_image) if mv else None,
            "hero_title": mv.hero_title if mv else "About Us",
            "hero_subtitle": mv.hero_subtitle if mv else "",
            "vision_and_purpose": mv.vision_and_purpose if mv else "",
            "statement_of_faith": mv.statement_of_faith if mv else "",
        },
        "who_we_are": {
            "title": who.title if who else "Who We Are",
            "content": who.content if who else "",
        },
        "director_message": director_message,
    })


# ========================= FOOTER =========================
@require_GET
def api_footer(request):
    footer = FooterContent.objects.first()
    if not footer:
        return JsonResponse({})
    return JsonResponse({
        "address": footer.address,
        "email": footer.email,
        "phone": footer.phone,
        "whatsapp": footer.whatsapp,
        "facebook": footer.facebook,
        "twitter": footer.twitter,
        "linkedin": footer.linkedin,
        "map_embed": footer.map_embed,
    })


# ========================= CONTACT =========================
@csrf_exempt
@require_POST
def api_contact(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    subject = data.get("subject", "Contact Form").strip()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return JsonResponse({"error": "Name, email, and message are required."}, status=400)

    recent = ContactMessage.objects.filter(
        email=email,
        created_at__gte=now() - timedelta(minutes=10)
    ).exists()
    if recent:
        return JsonResponse({"message": "We already received your message. Thank you!"})

    ContactMessage.objects.create(
        name=name, email=email, subject=subject, message=message
    )

    from django.core.mail import send_mail
    try:
        send_mail(
            subject=f"New Contact Message: {subject}",
            message=f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["info@torchbearersmission.org"],
            fail_silently=True,
        )
        send_mail(
            subject="We received your message",
            message=(
                f"Dear {name},\n\nThank you for contacting Torchbearers Mission Incorporated.\n\n"
                "We have received your message and will respond shortly.\n\nGod bless you,\n"
                "Torchbearers Mission Incorporated"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception:
        pass

    return JsonResponse({"message": "Message sent successfully."})


# ========================= VOLUNTEER =========================
@csrf_exempt
@require_POST
def api_volunteer(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    message = data.get("message", "").strip()

    if not full_name or not email:
        return JsonResponse({"error": "Full name and email are required."}, status=400)

    if Volunteer.objects.filter(email=email).exists():
        return JsonResponse({"message": "You are already registered as a volunteer. Thank you!"})

    Volunteer.objects.create(
        full_name=full_name,
        email=email,
        phone=phone,
        message=message,
    )

    return JsonResponse({"message": "Thank you for signing up as a volunteer!"})


# ========================= NEWSLETTER =========================
@csrf_exempt
@require_POST
def api_newsletter_subscribe(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = data.get("email", "").strip().lower()
    first_name = data.get("first_name", "").strip()

    if not email:
        return JsonResponse({"error": "Email is required."}, status=400)

    subscriber, created = NewsletterSubscriber.objects.get_or_create(
        email=email,
        defaults={"first_name": first_name, "is_active": True},
    )
    if not created:
        subscriber.is_active = True
        if first_name:
            subscriber.first_name = first_name
        subscriber.save()

    return JsonResponse({"message": "You have been subscribed. Thank you!"})


@require_GET
def api_newsletter_unsubscribe(request, token):
    try:
        sub = NewsletterSubscriber.objects.get(unsubscribe_token=token)
        sub.is_active = False
        sub.save()
        return JsonResponse({"message": "You have been unsubscribed successfully."})
    except NewsletterSubscriber.DoesNotExist:
        return JsonResponse({"error": "Invalid unsubscribe token."}, status=404)


# ========================= STATS =========================
@require_GET
def api_stats(request):
    total_donations = Donation.objects.filter(is_verified=True).aggregate(
        total=Sum("amount")
    )["total"] or 0
    donor_count = Donation.objects.filter(is_verified=True).count()
    project_count = Project.objects.filter(is_active=True).count()
    volunteer_count = Volunteer.objects.count()

    return JsonResponse({
        "total_donations": str(total_donations),
        "donor_count": donor_count,
        "project_count": project_count,
        "volunteer_count": volunteer_count,
    })
