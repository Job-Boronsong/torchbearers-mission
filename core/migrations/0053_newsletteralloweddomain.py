from django.db import migrations, models


OFFICIAL_NEWSLETTER_DOMAINS = (
    "torchbearersmission.org",
    "www.torchbearersmission.org",
    "torchbearersmissions.org",
    "www.torchbearersmissions.org",
)


def seed_official_domains(apps, schema_editor):
    NewsletterAllowedDomain = apps.get_model("core", "NewsletterAllowedDomain")
    NewsletterAllowedDomain.objects.bulk_create(
        [
            NewsletterAllowedDomain(domain=domain)
            for domain in OFFICIAL_NEWSLETTER_DOMAINS
        ]
    )


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0052_alter_donation_transaction_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="NewsletterAllowedDomain",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "domain",
                    models.CharField(
                        help_text=(
                            "Hostname only, for example partner.example.org. "
                            "Do not include a scheme, path, port, or wildcard."
                        ),
                        max_length=253,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Newsletter allowed domain",
                "verbose_name_plural": "Newsletter allowed domains",
                "ordering": ("domain",),
            },
        ),
        migrations.RunPython(seed_official_domains, migrations.RunPython.noop),
    ]