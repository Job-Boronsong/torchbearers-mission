from django.shortcuts import render, get_object_or_404, redirect
from django.conf import settings
from django.db.models import Sum
from django.core.mail import send_mail
import requests

from .models import (
    MissionVision,
    ContactMessage,
    BlogPost,
    Project,
    Donation,
    Volunteer,
    TeamMember,
    CarouselSlide,
)


# ================= HOME =================
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
def about(request):
    team = TeamMember.objects.filter(is_active=True)
    return render(request, "core/about.html", {"team": team})


# ================= MISSION & VISION =================
def about(request):
    mv = MissionVision.objects.first()
    team = TeamMember.objects.filter(is_active=True)
    return render(request, "core/about.html", {
        "mv": mv,
        "team": team
    })

# ================= CONTACT =================
def contact(request):
    success = False

    if request.method == 'POST':
        # 🐝 Honeypot check
        if request.POST.get("website"):
            return render(request, 'core/contact.html', {'success': False})

        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')

        ContactMessage.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message,
        )

        # ✉️ Send auto-reply email (Part 2 below)
        send_mail(
            subject="We received your message",
            message=(
                f"Dear {name},\n\n"
                "Thank you for contacting Torchbearers Missions Incorporated.\n\n"
                "We have received your message and will respond shortly.\n\n"
                "God bless you,\n"
                "Torchbearers Missions Incorporated"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )

        success = True

    return render(request, 'core/contact.html', {'success': success})


# ================= BLOG =================
def blog_list(request):
    posts = BlogPost.objects.filter(is_published=True).order_by("-created_at")
    return render(request, "core/blog_list.html", {"posts": posts})


def blog_detail(request, slug):
    post = get_object_or_404(BlogPost, slug=slug, is_published=True)
    return render(request, "core/blog_detail.html", {"post": post})


# ================= PROJECTS =================
def project_list(request):
    projects = Project.objects.filter(is_active=True).order_by("-created_at")
    return render(request, "core/project_list.html", {"projects": projects})


def project_detail(request, slug):
    project = get_object_or_404(Project, slug=slug, is_active=True)
    return render(request, "core/project_detail.html", {"project": project})


# ================= DONATIONS (FLUTTERWAVE VERIFY) =================
def verify_donation(request):
    transaction_id = request.GET.get("transaction_id")
    if not transaction_id:
        return redirect("/")

    headers = {
        "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"
    }

    response = requests.get(
        f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify",
        headers=headers,
        timeout=15
    )

    data = response.json()
    if data.get("status") != "success":
        return redirect("/")

    tx_data = data.get("data")
    if tx_data.get("status") != "successful":
        return redirect("/")

    customer = tx_data.get("customer", {})
    fw_payment_type = tx_data.get("payment_type")

    if fw_payment_type == "card":
        payment_method = "visa"
    elif fw_payment_type == "mobilemoneyghana":
        payment_method = "momo"
    else:
        payment_method = fw_payment_type

    donation, created = Donation.objects.get_or_create(
        transaction_id=transaction_id,
        defaults={
            "donor_name": customer.get("name", "Anonymous"),
            "email": customer.get("email"),
            "phone_number": customer.get("phonenumber", ""),
            "amount": tx_data.get("amount"),
            "payment_method": payment_method,
            "momo_network": tx_data.get("network", ""),
            "is_verified": True,
        }
    )

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
def register_volunteer(request):
    if request.method == "POST":
        Volunteer.objects.create(
            full_name=request.POST.get("full_name"),
            email=request.POST.get("email"),
            phone=request.POST.get("phone"),
            message = request.POST.get("message")
        )
        return redirect("/?volunteer=success")

    return redirect("/")


def about(request):
    team = TeamMember.objects.filter(is_active=True)
    mv = MissionVision.objects.first()

    return render(request, 'core/about.html', {
        'team': team,
        'mv': mv,
    })
