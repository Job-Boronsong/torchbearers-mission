from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.admin.models import LogEntry, ADDITION, DELETION
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError

from .models import (
    Donation,
    Newsletter,
    NewsletterAllowedDomain,
    NewsletterClick,
    NewsletterSubscriber,
)


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

    def test_newsletter_click_allows_domain_added_to_admin_allowlist(self):
        NewsletterAllowedDomain.objects.create(domain="trusted-partner.example")
        target = "https://trusted-partner.example/campaign"

        response = self.client.get(
            reverse(
                "core:newsletter_click_redirect",
                args=[self.newsletter.id, self.subscriber.id],
            ),
            {"url": target},
        )

        self.assertRedirects(response, target, fetch_redirect_response=False)

    def test_newsletter_click_rejects_domain_after_allowlist_removal(self):
        allowed_domain = NewsletterAllowedDomain.objects.create(
            domain="trusted-partner.example"
        )
        target = "https://trusted-partner.example/campaign"
        allowed_domain.delete()

        response = self.client.get(
            reverse(
                "core:newsletter_click_redirect",
                args=[self.newsletter.id, self.subscriber.id],
            ),
            {"url": target},
        )

        self.assertRedirects(response, "/")
        self.assertFalse(NewsletterClick.objects.exists())

    def test_newsletter_allowed_domain_rejects_non_hostname_values(self):
        for invalid_domain in (
            "https://trusted-partner.example",
            "trusted-partner.example/path",
            "*.trusted-partner.example",
            "trusted-partner.example:8443",
        ):
            with self.subTest(invalid_domain=invalid_domain):
                with self.assertRaises(ValidationError):
                    NewsletterAllowedDomain.objects.create(domain=invalid_domain)

    def test_admin_allowlist_changes_are_protected_and_audited(self):
        admin_user = get_user_model().objects.create_superuser(
            username="newsletter-admin",
            email="admin@example.com",
            password="strong-admin-password",
        )
        admin_user.userprofile.must_change_password = False
        admin_user.userprofile.save(update_fields=["must_change_password"])
        changelist_url = reverse("admin:core_newsletteralloweddomain_changelist")
        add_url = reverse("admin:core_newsletteralloweddomain_add")
        response = self.client.get(add_url)
        self.assertRedirects(
            response,
            f"{reverse('admin:login')}?next={add_url}",
        )

        self.client.force_login(admin_user)

        response = self.client.post(add_url, {"domain": "trusted-partner.example"})
        self.assertRedirects(response, changelist_url)

        allowed_domain = NewsletterAllowedDomain.objects.get(
            domain="trusted-partner.example"
        )
        content_type = ContentType.objects.get_for_model(NewsletterAllowedDomain)
        self.assertTrue(
            LogEntry.objects.filter(
                user=admin_user,
                content_type=content_type,
                object_id=str(allowed_domain.pk),
                action_flag=ADDITION,
            ).exists()
        )

        response = self.client.post(
            reverse(
                "admin:core_newsletteralloweddomain_delete",
                args=[allowed_domain.pk],
            ),
            {"post": "yes"},
        )
        self.assertRedirects(response, changelist_url)
        self.assertFalse(
            NewsletterAllowedDomain.objects.filter(pk=allowed_domain.pk).exists()
        )
        self.assertTrue(
            LogEntry.objects.filter(
                user=admin_user,
                content_type=content_type,
                object_id=str(allowed_domain.pk),
                action_flag=DELETION,
            ).exists()
        )


class DonationVerificationSecurityTests(TestCase):
    verify_url = reverse("core:verify_donation")

    def test_frontend_callback_path_reaches_django_and_rejects_invalid_request(self):
        response = self.client.get(
            "/donation/verify/",
            {"transaction_id": "not-a-numeric-transaction"},
        )

        self.assertRedirects(response, "/")

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
                "id": int(transaction_id),
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
        self.assertEqual(donation.payment_method, "card")
        self.assertTrue(donation.is_verified)
        send_mail.assert_called_once()

    @override_settings(FLUTTERWAVE_SECRET_KEY="test-flutterwave-secret")
    @patch("core.views.send_mail")
    @patch("core.views.requests.get")
    def test_verify_donation_rejects_unsupported_payment_method(
        self, get, send_mail
    ):
        transaction_id = "1234567890"
        payment_response = Mock()
        payment_response.json.return_value = {
            "status": "success",
            "data": {
                "id": int(transaction_id),
                "status": "successful",
                "currency": "GHS",
                "amount": 50,
                "customer": {
                    "name": "Ama Mensah",
                    "email": "ama@example.com",
                },
                "payment_type": "banktransfer",
            },
        }
        get.return_value = payment_response

        response = self.client.get(
            self.verify_url,
            {"transaction_id": transaction_id},
        )

        self.assertRedirects(response, "/")
        self.assertFalse(Donation.objects.exists())
        send_mail.assert_not_called()

    @override_settings(FLUTTERWAVE_SECRET_KEY="test-flutterwave-secret")
    @patch("core.views.send_mail")
    @patch("core.views.requests.get")
    def test_verify_donation_rejects_unsuccessful_or_mismatched_payment_responses(
        self, get, send_mail
    ):
        transaction_id = "1234567890"
        valid_transaction_data = {
            "id": int(transaction_id),
            "status": "successful",
            "currency": "GHS",
            "amount": 50,
            "customer": {
                "name": "Ama Mensah",
                "email": "ama@example.com",
            },
            "payment_type": "card",
        }
        rejected_responses = (
            (
                "unsuccessful API response",
                {"status": "error", "data": valid_transaction_data},
            ),
            (
                "unsuccessful transaction",
                {
                    "status": "success",
                    "data": {**valid_transaction_data, "status": "failed"},
                },
            ),
            (
                "mismatched transaction ID",
                {
                    "status": "success",
                    "data": {**valid_transaction_data, "id": 987654321},
                },
            ),
            (
                "wrong currency",
                {
                    "status": "success",
                    "data": {**valid_transaction_data, "currency": "USD"},
                },
            ),
            (
                "zero amount",
                {
                    "status": "success",
                    "data": {**valid_transaction_data, "amount": 0},
                },
            ),
            (
                "negative amount",
                {
                    "status": "success",
                    "data": {**valid_transaction_data, "amount": -1},
                },
            ),
            (
                "non-numeric amount",
                {
                    "status": "success",
                    "data": {**valid_transaction_data, "amount": "not-an-amount"},
                },
            ),
        )

        for case, response_data in rejected_responses:
            with self.subTest(case=case):
                payment_response = Mock()
                payment_response.json.return_value = response_data
                get.return_value = payment_response

                response = self.client.get(
                    self.verify_url,
                    {"transaction_id": transaction_id},
                )

                self.assertRedirects(response, "/")
                self.assertFalse(Donation.objects.exists())

        self.assertEqual(get.call_count, len(rejected_responses))
        send_mail.assert_not_called()
