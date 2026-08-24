from django.db import migrations


def seed_homepage_hero(apps, schema_editor):
    CarouselSlide = apps.get_model("core", "CarouselSlide")

    if CarouselSlide.objects.filter(is_active=True).exists():
        return

    CarouselSlide.objects.create(
        title="Carrying the Light",
        subtitle="Spreading hope, truth, and love across Africa and beyond.",
        image="",
        button_text="",
        button_link="",
        layout="center",
        is_active=True,
        order=0,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0053_newsletteralloweddomain"),
    ]

    operations = [
        migrations.RunPython(seed_homepage_hero, migrations.RunPython.noop),
    ]