from django_ckeditor_5.fields import CKEditor5Field
from ckeditor_uploader.fields import RichTextUploadingField
from django.contrib.auth.models import User
from django.db import models
import uuid
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils import timezone
from django.utils.html import mark_safe, strip_tags
from .utils.image import optimize_image
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile


# =========================
# Mission & Vision
# =========================
class MissionVision(models.Model):
    hero_image = models.ImageField(upload_to='about/', blank=True, null=True, help_text="Background image for the About Us hero section")
    hero_title = models.CharField(max_length=200, default="About Us", help_text="Main heading shown on the About Us hero")
    hero_subtitle = models.CharField(max_length=400, blank=True, default="A community dedicated to shining light in dark places.", help_text="Subtitle shown below the heading")
    vision_and_purpose = models.TextField()
    statement_of_faith = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Mission Vision & Faith"


# =========================
# Projects
# =========================
class Project(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    description = CKEditor5Field("Description", config_name="default")
    feature_image = models.ImageField(upload_to='projects/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    show_donate = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# =========================
# Blog
# =========================
class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    content = RichTextUploadingField()
    feature_image = models.ImageField(upload_to='blog/', blank=True, null=True)
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_posts"
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    seo_title = models.CharField(max_length=60, blank=True, help_text="Recommend: 50-60 characters")
    seo_description = models.CharField(max_length=160, blank=True, help_text="Recommend: 150-160 characters")


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# =========================
# Volunteers 
# =========================
class Volunteer(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


# =========================
# Donations
# =========================
class Donation(models.Model):
    PAYMENT_METHODS = (
        ('momo', 'Mobile Money'),
        ('card', 'Visa Card'),
    )

    MOMO_NETWORKS = (
        ('mtn', 'MTN MoMo'),
        ('telecel', 'Telecel Cash'),
    )

    donor_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    momo_network = models.CharField(max_length=10, choices=MOMO_NETWORKS, blank=True)
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"GHS {self.amount} - {self.payment_method}"


# =========================
# Contact Messages
# =========================
class ContactMessage(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject} - {self.name}"


# =========================
# Team Members
# =========================
class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='team/', blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name

# =========================
# Footer Content
# =========================
class FooterContent(models.Model):
    address = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=255)

    whatsapp = models.CharField(
        max_length=20,
        help_text="International format e.g. 233XXXXXXXXX"
    )

    facebook = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)

    map_embed = models.TextField(
        help_text="Paste Google Maps iframe code here"
    )

    def __str__(self):
        return "Footer Content"



class Article(models.Model):
    CATEGORY_CHOICES = (
        ('blog', 'Blog'),
        ('project', 'Project'),
    )

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    author = models.CharField(max_length=100, blank=True)
    featured_image = models.ImageField(upload_to='articles/', blank=True)
    content = models.TextField()  # rich text later
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CarouselSlide(models.Model):

    LAYOUT_CHOICES = (
        ("center", "Center"),
        ("left", "Left aligned"),
        ("right", "Right aligned"),
    )

    title = models.CharField(max_length=200)
    subtitle = models.TextField(blank=True)
    image = models.ImageField(upload_to="carousel/")
    button_text = models.CharField(max_length=100, blank=True)
    button_link = models.URLField(blank=True)
    layout = models.CharField(
        max_length=10,
        choices=LAYOUT_CHOICES,
        default="center"
    )
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.image:
            img = Image.open(self.image)
            img = img.convert("RGB")

            # Resize (safe for large screens)
            img.thumbnail((1920, 1080))

            buffer = BytesIO()
            img.save(buffer, format="WEBP", quality=80)

            self.image.save(
                self.image.name.split(".")[0] + ".webp",
                ContentFile(buffer.getvalue()),
                save=False
            )

            super().save(update_fields=["image"])

    def __str__(self):
        return self.title




class WhoWeAre(models.Model):
    title = models.CharField(
        max_length=200,
        default="Who We Are"
    )

    content = models.TextField(
        help_text="Main description for Who We Are section"
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Who We Are"
        verbose_name_plural = "Who We Are"

    def __str__(self):
        return self.title


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    must_change_password = models.BooleanField(default=True)

    def __str__(self):
        return self.user.username

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


class LoginAudit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    successful = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user} @ {self.timestamp}"


class NewsletterSubscriber(models.Model):
    first_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    unsubscribe_token = models.UUIDField(
        default=uuid.uuid4,
        editable=False
    )

    def __str__(self):
        return self.email


class Newsletter(models.Model):
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=255)
    body = models.TextField(help_text="HTML content only (no <html> or <body>)")
    created_at = models.DateTimeField(auto_now_add=True)
    sent = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class NewsletterClick(models.Model):
    newsletter = models.ForeignKey(Newsletter, on_delete=models.CASCADE)
    subscriber = models.ForeignKey(NewsletterSubscriber, on_delete=models.CASCADE)
    url = models.URLField()
    clicked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subscriber.email} clicked {self.url}"



class NewsletterOpen(models.Model):
    newsletter = models.ForeignKey(Newsletter, on_delete=models.CASCADE)
    subscriber = models.ForeignKey(NewsletterSubscriber, on_delete=models.CASCADE)
    opened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("newsletter", "subscriber")

    def __str__(self):
        return f"{self.subscriber.email} opened {self.newsletter.title}"
