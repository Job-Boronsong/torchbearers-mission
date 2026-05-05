from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import PasswordChangeView
from django.urls import reverse_lazy
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.conf import settings
from django.db.models import Sum
from django.core.mail import send_mail, send_mass_mail
import requests
from django_ratelimit.decorators import ratelimit
from django.contrib import messages
from django.http import HttpResponse, HttpResponseForbidden
from django.template.loader import render_to_string
from .models import (
    MissionVision,
    ContactMessage,
    BlogPost,
    Project,
    Donation,
    Volunteer,
    WhoWeAre,
    TeamMember,
    NewsletterSubscriber,
    NewsletterOpen,
    NewsletterClick,
    CarouselSlide,
)


# ================= HOME =================
@ensure_csrf_cookie
def home(request):
    slides = CarouselSlide.objects.filter(is_active=True).order_by("order")

    projects = Project.objects.filter(is_active=True).order_by("-created_at")[:3]
    blogs = BlogPost.objects.filter(is_published=True).order_by("-created_at")[:3]

    total_donations = Donation.objects.filter(is_verified=True).aggregate(
        total=Sum("amount")
    )["total"] or 0

    donor_count = Donation.objects.filter(is_verified=True).count()

    return render(request, "core/home.html", {
        "slides": slides,
        "projects": projects,
        "blogs": blogs,
        "total_donations": total_donations,
        "donor_count": donor_count,
    })


# ================= ABOUT =================
from django.shortcuts import render
from .models import MissionVision, WhoWeAre, TeamMember

@ensure_csrf_cookie
def about(request):
    context = {
        "mv": MissionVision.objects.first(),
        "who": WhoWeAre.objects.first(),
        "team": TeamMember.objects.filter(is_active=True),
    }

    return render(request, "core/about.html", context)


# ================= CONTACT =================
from django.views.decorators.http import require_http_methods
from django.utils.timezone import now
from datetime import timedelta

@ensure_csrf_cookie
@require_http_methods(["GET", "POST"])
def contact(request):
    success = False

    if request.method == "POST":

        # 🐝 Honeypot (bot protection)
        if request.POST.get("website"):
            return render(request, "core/contact.html", {"success": False})

        name = request.POST.get("name", "").strip()
        email = request.POST.get("email", "").strip().lower()
        subject = request.POST.get("subject", "Contact Form")
        message = request.POST.get("message", "").strip()

        if not name or not email or not message:
            return render(request, "core/contact.html", {"success": False})

        # 🚫 Prevent repeated spam (same email within 10 minutes)
        recent = ContactMessage.objects.filter(
            email=email,
            created_at__gte=now() - timedelta(minutes=10)
        ).exists()

        if recent:
            messages.info(request, "We already received your message. Thank you!")
            return redirect("/contact/")

        # ✅ Save message
        ContactMessage.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message,
        )

        # 📧 EMAIL TO ADMIN
        send_mail(
            subject=f"New Contact Message: {subject}",
            message=(
                f"Name: {name}\n"
                f"Email: {email}\n\n"
                f"Message:\n{message}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["info@torchbearersmission.org"],
            fail_silently=False,
        )

        # 📧 AUTO-REPLY
        send_mail(
            subject="We received your message",
            message=(
                f"Dear {name},\n\n"
                "Thank you for contacting Torchbearers Mission Incorporated.\n\n"
                "We have received your message and will respond shortly.\n\n"
                "God bless you,\n"
                "Torchbearers Mission Incorporated"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        success = True

    return render(request, "core/contact.html", {"success": success})


# ================= BLOG =================
@ensure_csrf_cookie
def blog_list(request):
    posts = BlogPost.objects.filter(is_published=True).order_by("-created_at")
    return render(request, "core/blog_list.html", {"posts": posts})


def blog_detail(request, slug):
    post = get_object_or_404(
        BlogPost,
        slug=slug,
        is_published=True
    )
    return render(request, "core/blog_detail.html", {"post": post})


# ================= PROJECTS =================
@ensure_csrf_cookie
def project_list(request):
    projects = Project.objects.filter(is_active=True).order_by("-created_at")
    return render(request, "core/project_list.html", {"projects": projects})


def project_detail(request, slug):
    project = get_object_or_404(
        Project,
        slug=slug,
        is_active=True
    )
    return render(request, "core/project_detail.html", {"project": project})


# ================= DONATIONS (FLUTTERWAVE VERIFY) =================
from django.views.decorators.http import require_GET
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@require_GET
def verify_donation(request):
    transaction_id = request.GET.get("transaction_id")
    if not transaction_id:
        return redirect("/")

    # 🚫 Prevent re-verification spam
    if Donation.objects.filter(transaction_id=transaction_id, is_verified=True).exists():
        return redirect("/")

    headers = {
        "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.get(
            f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify",
            headers=headers,
            timeout=15,
        )
        data = response.json()
    except Exception as e:
        logger.error(f"Flutterwave verification failed: {e}")
        return redirect("/")

    if data.get("status") != "success":
        return redirect("/")

    tx_data = data.get("data", {})
    if tx_data.get("status") != "successful":
        return redirect("/")

    # 🛡️ Validate currency & amount
    if tx_data.get("currency") != "GHS":
        return redirect("/")

    amount = tx_data.get("amount")
    if not amount or amount <= 0:
        return redirect("/")

    customer = tx_data.get("customer", {})
    fw_payment_type = tx_data.get("payment_type", "")

    if fw_payment_type == "card":
        payment_method = "visa"
    elif fw_payment_type == "mobilemoneyghana":
        payment_method = "momo"
    else:
        payment_method = fw_payment_type

    with transaction.atomic():
        donation, created = Donation.objects.get_or_create(
            transaction_id=transaction_id,
            defaults={
                "donor_name": customer.get("name", "Anonymous"),
                "email": customer.get("email"),
                "phone_number": customer.get("phonenumber", ""),
                "amount": amount,
                "payment_method": payment_method,
                "momo_network": tx_data.get("network", ""),
                "is_verified": True,
            },
        )

    # 📧 Thank-you email (only once)
    if created and donation.email:
        send_mail(
            subject="Thank you for your donation",
            message=(
                f"Dear {donation.donor_name},\n\n"
                f"Thank you for donating GHS {donation.amount} "
                f"to Torchbearers Mission Incorporated.\n\n"
                "God bless you."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[donation.email],
            fail_silently=True,
        )

    return redirect("/")


# ================= VOLUNTEER =================

def verify_turnstile(token: str) -> bool:
    if not token:
        return False

    try:
        response = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": settings.CLOUDFLARE_TURNSTILE_SECRET,
                "response": token,
            },
            timeout=5,
        )
        data = response.json()
        return data.get("success", False)
    except Exception:
        return False


@require_POST
@csrf_protect
def register_volunteer(request):
    # Honeypot
    if request.POST.get("website"):
        return HttpResponseForbidden("Bot detected")

    token = request.POST.get("cf-turnstile-response")
    if not token or not verify_turnstile(token):
        return HttpResponseForbidden("Verification failed")

    full_name = request.POST.get("full_name", "").strip()
    email = request.POST.get("email", "").strip().lower()
    phone = request.POST.get("phone", "").strip()
    message = request.POST.get("message", "").strip()

    if not full_name or not email:
        return redirect("/")

    if Volunteer.objects.filter(email=email).exists():
        messages.info(request, "You have already volunteered.")
        return redirect("/")

    Volunteer.objects.create(
        full_name=full_name,
        email=email,
        phone=phone,
        message=message,
    )

    send_mail(
        "New Volunteer Registration",
        f"Name: {full_name}\nEmail: {email}\nPhone: {phone}\n\n{message}",
        settings.DEFAULT_FROM_EMAIL,
        ["info@torchbearersmission.org"],
    )

    return redirect("/?volunteer=success")



from django.views.decorators.http import require_GET

@require_GET
def blog_pdf(request, slug):
    from weasyprint import HTML
    from django.template.loader import render_to_string

    post = get_object_or_404(BlogPost, slug=slug, is_published=True)

    html_string = render_to_string(
        "core/blog_pdf.html",
        {"post": post}
    )

    pdf = HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{post.slug}.pdf"'
    return response


class ForcedPasswordChangeView(PasswordChangeView):
    success_url = reverse_lazy("password_change_done")

    def form_valid(self, form):
        response = super().form_valid(form)

        user = self.request.user
        profile = getattr(user, "userprofile", None)

        if profile:
            profile.must_change_password = False
            profile.save()

        if user.email:
            send_mail(
                subject="Your password has been changed",
                message=(
                    f"Hello {user.get_full_name() or user.username},\n\n"
                    "This is a confirmation that your account password "
                    "was changed successfully.\n\n"
                    "If you did NOT perform this action, please contact "
                    "Torchbearers Mission Incorporated support immediately."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        return response


from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect

@require_POST
@csrf_protect
def newsletter_subscribe(request):
    email = request.POST.get("email", "").strip().lower()

    if not email:
        messages.error(request, "Please enter a valid email address.")
        return redirect(request.META.get("HTTP_REFERER", "/"))

    if NewsletterSubscriber.objects.filter(email=email).exists():
        messages.info(
            request,
            "This email is already subscribed to our newsletter."
        )
        return redirect(request.META.get("HTTP_REFERER", "/"))

    subscriber = NewsletterSubscriber.objects.create(email=email)

    send_mail(
        subject="Newsletter Subscription Successful",
        message=(
            "Thank you for subscribing to Torchbearers Mission Incorporated.\n\n"
            "You will now receive updates on missions and projects.\n\n"
            "God bless you,\n"
            "Torchbearers Mission Incorporated"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
    )

    messages.success(
        request,
        "Subscription successful! Thank you for subscribing."
    )

    return redirect(request.META.get("HTTP_REFERER", "/"))


from django.views.decorators.http import require_GET

@require_GET
def newsletter_unsubscribe(request, token):
    subscriber = get_object_or_404(
        NewsletterSubscriber,
        unsubscribe_token=token
    )

    if subscriber.is_active:
        subscriber.is_active = False
        subscriber.save(update_fields=["is_active"])

    return render(
        request,
        "newsletter/unsubscribed.html",
        {"email": subscriber.email}
    )

@require_GET
def newsletter_click_redirect(request, newsletter_id, subscriber_id):
    subscriber = get_object_or_404(
        NewsletterSubscriber,
        id=subscriber_id,
        is_active=True
    )

    newsletter = get_object_or_404(Newsletter, id=newsletter_id)

    target = request.GET.get("next")
    if not target:
        return redirect("/")

    NewsletterClick.objects.create(
        newsletter=newsletter,
        subscriber=subscriber,
        url=target
    )

    return redirect(target)

@require_GET
def newsletter_open_pixel(request, newsletter_id, subscriber_id):
    newsletter = get_object_or_404(
        Newsletter,
        id=newsletter_id
    )

    subscriber = get_object_or_404(
        NewsletterSubscriber,
        id=subscriber_id,
        is_active=True
    )

    NewsletterOpen.objects.get_or_create(
        newsletter=newsletter,
        subscriber=subscriber
    )

    pixel = (
        b"GIF89a\x01\x00\x01\x00\x80\x00\x00"
        b"\x00\x00\x00\xff\xff\xff!"
        b"\xf9\x04\x01\x00\x00\x00\x00,"
        b"\x00\x00\x00\x00\x01\x00\x01\x00"
        b"\x00\x02\x02D\x01\x00;"
    )

    response = HttpResponse(pixel, content_type="image/gif")
    response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response

from urllib.parse import urlparse
from django.views.decorators.http import require_GET

@require_GET
def newsletter_click_redirect(request, newsletter_id, subscriber_id):
    target = request.GET.get("url") or request.GET.get("next")
    if not target:
        return redirect("/")

    parsed = urlparse(target)

    # 🔐 Prevent open redirects
    if parsed.scheme not in ("http", "https"):
        return redirect("/")

    newsletter = get_object_or_404(Newsletter, id=newsletter_id)
    subscriber = get_object_or_404(
        NewsletterSubscriber,
        id=subscriber_id,
        is_active=True
    )

    NewsletterClick.objects.create(
        newsletter=newsletter,
        subscriber=subscriber,
        url=target
    )

    return redirect(target)

from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def donate_page(request):
    return render(request, "donate.html")
