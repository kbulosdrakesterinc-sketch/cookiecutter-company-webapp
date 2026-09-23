from typing import Any, ClassVar, cast, override

from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.accounts.services.activation import (
    build_account_activation_link,
    get_user_from_activation_credentials,
)


def as_response(value: Any) -> Response:
    return cast(Response, value)


class UserProvisioningAPITests(APITestCase):
    client: APIClient
    password: ClassVar[str] = "strong-test-password"

    @classmethod
    @override
    def setUpTestData(cls) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        cls.viewer = user_manager.create_user(
            email="viewer@example.com",
            password=cls.password,
        )
        cls.provisioner = user_manager.create_user(
            email="provisioner@example.com",
            password=cls.password,
        )
        cls.superuser = user_manager.create_superuser(
            email="superuser@example.com",
            password=cls.password,
        )

        view_permission = Permission.objects.get(
            codename="view_user",
            content_type__app_label="accounts",
        )
        add_permission = Permission.objects.get(
            codename="add_user",
            content_type__app_label="accounts",
        )

        cls.viewer.user_permissions.add(view_permission)
        cls.provisioner.user_permissions.add(add_permission)

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def provision(
        self,
        payload: dict[str, object],
    ) -> Response:
        return as_response(
            self.client.post(
                reverse("v1:user-directory"),
                payload,
                format="json",
            )
        )

    def test_anonymous_user_cannot_provision(self) -> None:
        response = self.provision(
            {
                "email": "new@example.com",
                "first_name": "New",
                "last_name": "User",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_view_only_user_can_get_but_cannot_post(self) -> None:
        self.client.force_login(self.viewer)

        get_response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
            )
        )
        post_response = self.provision(
            {
                "email": "new@example.com",
                "first_name": "New",
                "last_name": "User",
            }
        )

        self.assertEqual(
            get_response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            post_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_add_only_user_can_post_but_cannot_get(self) -> None:
        self.client.force_login(self.provisioner)

        post_response = self.provision(
            {
                "email": "new@example.com",
                "first_name": "New",
                "last_name": "User",
            }
        )
        get_response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
            )
        )

        self.assertEqual(
            post_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            get_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_superuser_can_provision(self) -> None:
        self.client.force_login(self.superuser)

        response = self.provision(
            {
                "email": "super-created@example.com",
                "first_name": "Super",
                "last_name": "Created",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_successful_provisioning_creates_pending_active_account(self) -> None:
        self.client.force_login(self.provisioner)

        response = self.provision(
            {
                "email": "  maria@example.com  ",
                "first_name": "  Maria  ",
                "last_name": "  Santos  ",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            email="maria@example.com",
        )

        self.assertEqual(user.first_name, "Maria")
        self.assertEqual(user.last_name, "Santos")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.has_usable_password())
        self.assertEqual(
            response.data["account_state"],
            "pending_activation",
        )

        activation = build_account_activation_link(
            user=user,
        )
        resolved_user = get_user_from_activation_credentials(
            uid=activation.uid,
            token=activation.token,
        )

        self.assertEqual(
            resolved_user.pk,
            user.pk,
        )

    def test_duplicate_email_returns_400_without_duplicate(self) -> None:
        self.client.force_login(self.provisioner)

        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        _ = user_manager.create_user(
            email="duplicate@example.com",
            password=None,
        )

        response = self.provision(
            {
                "email": "duplicate@example.com",
                "first_name": "Duplicate",
                "last_name": "User",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn(
            "email",
            response.data,
        )
        self.assertEqual(
            User.objects.filter(
                email="duplicate@example.com",
            ).count(),
            1,
        )

    def test_invalid_email_returns_400(self) -> None:
        self.client.force_login(self.provisioner)

        response = self.provision(
            {
                "email": "not-an-email",
                "first_name": "Invalid",
                "last_name": "Email",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(
            User.objects.filter(
                email="not-an-email",
            ).exists()
        )

    def test_password_and_privileged_fields_cannot_initialize_account(self) -> None:
        self.client.force_login(self.provisioner)

        response = self.provision(
            {
                "email": "safe@example.com",
                "first_name": "Safe",
                "last_name": "User",
                "password": "InjectedPassword123!",
                "is_staff": True,
                "is_superuser": True,
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            email="safe@example.com",
        )

        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
