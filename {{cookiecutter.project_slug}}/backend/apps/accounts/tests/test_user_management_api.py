from typing import Any, ClassVar, cast, override
from uuid import uuid4

from django.contrib.auth import authenticate
from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User


def as_response(value: Any) -> Response:
    return cast(Response, value)


class UserManagementAPITests(APITestCase):
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
        cls.manager = user_manager.create_user(
            email="manager@example.com",
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
        change_permission = Permission.objects.get(
            codename="change_user",
            content_type__app_label="accounts",
        )

        cls.viewer.user_permissions.add(view_permission)
        cls.provisioner.user_permissions.add(add_permission)
        cls.manager.user_permissions.add(change_permission)

        cls.target = user_manager.create_user(
            email="target@example.com",
            password=cls.password,
            first_name="Target",
            last_name="User",
        )
        cls.inactive = user_manager.create_user(
            email="inactive@example.com",
            password=cls.password,
            is_active=False,
        )
        cls.pending = user_manager.create_user(
            email="pending@example.com",
            password=None,
            first_name="Pending",
            last_name="Activation",
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def detail_url(self, user: User | None = None) -> str:
        return reverse(
            "v1:user-detail",
            kwargs={
                "user_id": (user or self.target).id,
            },
        )

    def patch(
        self,
        payload: dict[str, object],
        *,
        user: User | None = None,
    ) -> Response:
        return as_response(
            self.client.patch(
                self.detail_url(user),
                payload,
                format="json",
            )
        )

    def test_anonymous_request_is_rejected(self) -> None:
        response = self.patch(
            {
                "first_name": "Changed",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_view_user_without_change_user_cannot_patch(self) -> None:
        self.client.force_login(self.viewer)

        response = self.patch(
            {
                "first_name": "Changed",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_add_user_without_change_user_cannot_patch(self) -> None:
        self.client.force_login(self.provisioner)

        response = self.patch(
            {
                "first_name": "Changed",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_change_user_can_get_detail(self) -> None:
        self.client.force_login(self.manager)

        response = as_response(
            self.client.get(
                self.detail_url(),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["email"],
            self.target.email,
        )

    def test_change_user_can_patch(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "first_name": "Changed",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_superuser_can_patch(self) -> None:
        self.client.force_login(self.superuser)

        response = self.patch(
            {
                "first_name": "Super",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_update_email(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "email": "  updated@example.com  ",
            }
        )

        self.target.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.target.email, "updated@example.com")
        self.assertEqual(response.data["email"], "updated@example.com")

    def test_update_first_name(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "first_name": "  Updated  ",
            }
        )

        self.target.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.target.first_name, "Updated")

    def test_update_last_name(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "last_name": "  Name  ",
            }
        )

        self.target.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.target.last_name, "Name")

    def test_partial_patch_does_not_overwrite_omitted_fields(self) -> None:
        self.client.force_login(self.manager)
        original_email = self.target.email
        original_last_name = self.target.last_name
        original_is_active = self.target.is_active

        response = self.patch(
            {
                "first_name": "Only",
            }
        )

        self.target.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.target.first_name, "Only")
        self.assertEqual(self.target.email, original_email)
        self.assertEqual(self.target.last_name, original_last_name)
        self.assertEqual(self.target.is_active, original_is_active)

    def test_response_returns_directory_user_representation(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "first_name": "Directory",
            }
        )

        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "email",
                "first_name",
                "last_name",
                "is_active",
                "account_state",
                "date_joined",
            },
        )
        self.assertEqual(response.data["account_state"], "active")

    def test_duplicate_email_returns_400(self) -> None:
        self.client.force_login(self.manager)
        original_email = self.target.email

        response = self.patch(
            {
                "email": self.inactive.email,
            }
        )

        self.target.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertEqual(self.target.email, original_email)

    def test_invalid_email_returns_400(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "email": "not-an-email",
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_privileged_fields_cannot_be_modified(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "is_staff": True,
                "is_superuser": True,
                "password": "InjectedPassword123!",
            }
        )

        self.target.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(self.target.is_staff)
        self.assertFalse(self.target.is_superuser)
        self.assertTrue(self.target.check_password(self.password))

    def test_nonexistent_user_returns_404(self) -> None:
        self.client.force_login(self.manager)

        response = as_response(
            self.client.patch(
                reverse(
                    "v1:user-detail",
                    kwargs={
                        "user_id": uuid4(),
                    },
                ),
                {
                    "first_name": "Missing",
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_active_user_can_be_deactivated(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "is_active": False,
            }
        )

        self.target.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.target.is_active)
        self.assertEqual(response.data["account_state"], "inactive")

    def test_inactive_user_can_be_reactivated(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "is_active": True,
            },
            user=self.inactive,
        )

        self.inactive.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.inactive.is_active)
        self.assertEqual(response.data["account_state"], "active")

    def test_pending_activation_user_can_be_deactivated(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "is_active": False,
            },
            user=self.pending,
        )

        self.pending.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.pending.is_active)
        self.assertFalse(self.pending.has_usable_password())
        self.assertEqual(response.data["account_state"], "inactive")

    def test_inactive_pending_user_reactivates_to_pending_activation(self) -> None:
        self.client.force_login(self.manager)
        self.pending.is_active = False
        self.pending.save(update_fields=["is_active"])

        response = self.patch(
            {
                "is_active": True,
            },
            user=self.pending,
        )

        self.pending.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.pending.is_active)
        self.assertFalse(self.pending.has_usable_password())
        self.assertEqual(response.data["account_state"], "pending_activation")

    def test_deactivated_user_cannot_authenticate(self) -> None:
        self.client.force_login(self.manager)

        response = self.patch(
            {
                "is_active": False,
            }
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(
            authenticate(
                email=self.target.email,
                password=self.password,
            )
        )
