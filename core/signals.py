from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.signals import user_logged_out
from django.contrib.auth.signals import user_logged_in, user_login_failed, user_logged_out
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def notify_password_change(sender, instance, **kwargs):
    if instance.pk and instance.has_usable_password():
        send_mail(
            subject="Your password was changed",
            message=(
                f"Hello {instance.username},\n\n"
                "Your password was successfully changed.\n"
                "If this was not you, please contact support immediately."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
            fail_silently=True,
        )

def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0]
    return request.META.get("REMOTE_ADDR")


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    LoginAudit.objects.create(
        user=user,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        successful=True,
    )


@receiver(user_login_failed)
def log_login_failed(sender, credentials, request, **kwargs):
    LoginAudit.objects.create(
        user=None,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        successful=False,
    )
