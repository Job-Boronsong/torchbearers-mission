from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

def optimize_image(image_field, max_width=1920, quality=80):
    img = Image.open(image_field)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Resize
    if img.width > max_width:
        ratio = max_width / float(img.width)
        height = int(float(img.height) * ratio)
        img = img.resize((max_width, height), Image.LANCZOS)

    buffer = BytesIO()
    img.save(buffer, format="WEBP", quality=quality, optimize=True)

    return ContentFile(buffer.getvalue())
