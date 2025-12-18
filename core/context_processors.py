from .models import FooterContent

def footer_context(request):
    footer = FooterContent.objects.first()
    return {
        "footer": footer
    }
