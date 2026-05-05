from .models import FooterContent

def footer_context(request):
    return {
        "footer": FooterContent.objects.first()
    }
