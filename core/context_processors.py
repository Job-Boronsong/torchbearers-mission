from .models import FooterContent
from django.conf import settings

def footer_context(request):
    footer = FooterContent.objects.first()
    return {
        "footer": footer
    }


def turnstile_keys(request):
    return {
        "CLOUDFLARE_TURNSTILE_SITE_KEY": settings.CLOUDFLARE_TURNSTILE_SITE_KEY
    }


def payment_keys(request):
    return {
        "FLUTTERWAVE_PUBLIC_KEY": settings.FLUTTERWAVE_PUBLIC_KEY,
    }
