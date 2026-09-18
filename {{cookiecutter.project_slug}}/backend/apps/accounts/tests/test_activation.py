from typing import ClassVar, cast, override

from django.core import mail
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.accounts.services.activation import (
    AccountActivationInvalidError,
    AccountAlreadyActivatedError,
    activate_account,
    build_account_activation_link,
    get_user_from_activation_credentials,
    send_account_activation_email,
)


class AccountActivationServiceTests(TestCase):
    user: ClassVar[User]

    @classmethod
    @override
    def setUpTestData(cls) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        cls.user = user_manager.create_user(
            email="user@example.com",
            password=None,
            first_name="Maria",
            last_name="Santos",
        )

    @override_settings(APP_NAME="Example Application")
    def test_activation_email_application_name(
        self,
    ) -> None:
        send_account_activation_email(
            user=self.user,
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

        message = mail.outbox[0]

        self.assertEqual(
            message.subject,
            "Activate your Example Application account",
        )

        self.assertIn(
            "Your Example Application account has been created.",
            message.body,
        )

    def test_activation_link_can_resolve_provisioned_user(
        self,
    ) -> None:
        activation = build_account_activation_link(
            user=self.user,
        )

        user = get_user_from_activation_credentials(
            uid=activation.uid,
            token=activation.token,
        )

        self.assertEqual(
            user.pk,
            self.user.pk,
        )

    def test_user_can_activate_account_with_valid_token(
        self,
    ) -> None:
        password = "StrongUserPassword123!"

        activation = build_account_activation_link(
            user=self.user,
        )

        activated_user = activate_account(
            uid=activation.uid,
            token=activation.token,
            password=password,
        )

        self.assertTrue(
            activated_user.has_usable_password(),
        )

        self.assertTrue(
            activated_user.check_password(
                password,
            )
        )

    def test_activation_token_cannot_be_reused(
        self,
    ) -> None:
        activation = build_account_activation_link(
            user=self.user,
        )

        activate_account(
            uid=activation.uid,
            token=activation.token,
            password="StrongUserPassword123!",
        )

        with self.assertRaises(
            AccountActivationInvalidError,
        ):
            activate_account(
                uid=activation.uid,
                token=activation.token,
                password="DifferentPassword123!",
            )

    def test_invalid_activation_token_is_rejected(
        self,
    ) -> None:
        activation = build_account_activation_link(
            user=self.user,
        )

        with self.assertRaises(
            AccountActivationInvalidError,
        ):
            get_user_from_activation_credentials(
                uid=activation.uid,
                token="invalid-token",
            )

    def test_already_activated_user_cannot_receive_activation_link(
        self,
    ) -> None:
        self.user.set_password(
            "StrongUserPassword123!",
        )
        self.user.save(
            update_fields=[
                "password",
            ]
        )

        with self.assertRaises(
            AccountAlreadyActivatedError,
        ):
            build_account_activation_link(
                user=self.user,
            )

    def test_activation_email_is_sent_to_user(
        self,
    ) -> None:
        send_account_activation_email(
            user=self.user,
        )

        self.assertEqual(
            len(mail.outbox),
            1,
        )

        message = mail.outbox[0]

        self.assertEqual(
            message.to,
            [
                self.user.email,
            ],
        )

        self.assertIn(
            "/activate-account/",
            message.body,
        )

    def test_weak_password_is_rejected(
        self,
    ) -> None:
        activation = build_account_activation_link(
            user=self.user,
        )

        with self.assertRaises(ValidationError):
            activate_account(
                uid=activation.uid,
                token=activation.token,
                password="short",
            )

        self.user.refresh_from_db()

        self.assertFalse(
            self.user.has_usable_password(),
        )
