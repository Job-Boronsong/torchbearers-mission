from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from .models import Newsletter, NewsletterClick, NewsletterSubscriber


class NewsletterRedirectSecurityTests(TestCase):
    def setUp(self):
        self.newsletter = Newsletter.objects.create(
            title="Monthly update",
            subject="Torchbearers news",
            body="<p>Latest news</p>",
        )
        self.subscriber = NewsletterSubscriber.objects.create(
            email="reader@example.com",
        )

    @patch("core.views.send_mail")
    def test_subscription_ignores_untrusted_referrer(self, send_mail):
        response = self.client.post(
            reverse("core:newsletter_subscribe"),
            {"email": "new-reader@example.com"},
            HTTP_REFERER="https://attacker.example/phishing",
        )

        self.assertRedirects(response, "/")

    @patch("core.views.send_mail")
    def test_subscription_uses_fixed_destination_without_referrer(self, send_mail):
        response = self.client.post(
            reverse("core:newsletter_subscribe"),
            {"email": ""},
            HTTP_REFERER="https://attacker.example/phishing",
        )

        self.assertRedirects(response, "/")

    def test_newsletter_click_rejects_untrusted_absolute_url(self):
        response = self.client.get(
            reverse(
                "core:newsletter_click_redirect",
                args=[self.newsletter.id, self.subscriber.id],
            ),
            {"url": "https://attacker.example/phishing"},
        )

        self.assertRedirects(response, "/")
        self.assertFalse(NewsletterClick.objects.exists())

    def test_newsletter_click_rejects_protocol_relative_url(self):
        response = self.client.get(
            reverse(
                "core:newsletter_click_redirect",
                args=[self.newsletter.id, self.subscriber.id],
            ),
            {"next": "//attacker.example/phishing"},
        )

        self.assertRedirects(response, "/")
        self.assertFalse(NewsletterClick.objects.exists())

    def test_newsletter_click_allows_approved_domain(self):
        target = "https://www.torchbearersmission.org/projects/hope/?source=newsletter"
        response = self.client.get(
            reverse(
                "core:newsletter_click_redirect",
                args=[self.newsletter.id, self.subscriber.id],
            ),
            {"url": target},
        )

        self.assertRedirects(response, target, fetch_redirect_response=False)
        self.assertTrue(
            NewsletterClick.objects.filter(
                newsletter=self.newsletter,
                subscriber=self.subscriber,
                url=target,
            ).exists()
        )
