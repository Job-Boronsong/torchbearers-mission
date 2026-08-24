from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from django.urls import reverse

from .models import Donation, Newsletter, NewsletterClick, NewsletterSubscriber


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

    def test_newsletter_click_rejects_malformed_url(self):
        response = self.client.get(
            reverse(
                "core:newsletter_click_redirect",
                args=[self.newsletter.id, self.subscriber.id],
            ),
            {"url": "https://[invalid-hostname"},
        )

        self.assertRedirects(response, "/")
        self.assertFalse(NewsletterClick.objects.exists())

    def test_newsletter_click_allows_same_site_relative_path(self):
        target = "/projects/hope/?source=newsletter"
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


class DonationVerificationSecurityTests(TestCase):
    verify_url = reverse("core:verify_donation")

    def test_verify_donation_rejects_invalid_transaction_ids(self):
        invalid_transaction_ids = (
            "abc123",
            "123/verify",
            "123%2Fverify",
            "-1",
            " 123",
        )

        with patch("core.views.requests.get") as get:
            for transaction_id in invalid_transaction_ids:
                with self.subTest(transaction_id=transaction_id):
                    response = self.client.get(
                        self.verify_url,
                        {"transaction_id": transaction_id},
                    )

                    self.assertRedirects(response, "/")

        get.assert_not_called()
        self.assertFalse(Donation.objects.exists())

    @override_settings(FLUTTERWAVE_SECRET_KEY="test-flutterwave-secret")
    @patch("core.views.send_mail")
    @patch("core.views.requests.get")
    def test_verify_donation_accepts_valid_transaction_id(
        self, get, send_mail
    ):
        transaction_id = "1234567890"
        payment_response = Mock()
        payment_response.json.return_value = {
            "status": "success",
            "data": {
                "status": "successful",
                "currency": "GHS",
                "amount": 50,
                "customer": {
                    "name": "Ama Mensah",
                    "email": "ama@example.com",
                    "phonenumber": "233555123456",
                },
                "payment_type": "card",
            },
        }
        get.return_value = payment_response

        response = self.client.get(
            self.verify_url,
            {"transaction_id": transaction_id},
        )

        self.assertRedirects(response, "/")
        get.assert_called_once_with(
            (
                "https://api.flutterwave.com/v3/transactions/"
                f"{transaction_id}/verify"
            ),
            headers={
                "Authorization": "Bearer test-flutterwave-secret",
                "Content-Type": "application/json",
            },
            timeout=15,
            allow_redirects=False,
        )
        donation = Donation.objects.get(transaction_id=transaction_id)
        self.assertEqual(donation.donor_name, "Ama Mensah")
        self.assertEqual(donation.email, "ama@example.com")
        self.assertEqual(donation.amount, 50)
        self.assertEqual(donation.payment_method, "visa")
        self.assertTrue(donation.is_verified)
        send_mail.assert_called_once()
