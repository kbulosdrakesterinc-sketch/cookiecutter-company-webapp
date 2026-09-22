from typing import Any, ClassVar, cast, override

from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User


def as_response(value: Any) -> Response:
    return cast(Response, value)


class UserDirectoryAPITests(APITestCase):
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
        cls.no_permission_user = user_manager.create_user(
            email="ordinary@example.com",
            password=cls.password,
        )
        cls.superuser = user_manager.create_superuser(
            email="superuser@example.com",
            password=cls.password,
        )

        permission = Permission.objects.get(
            codename="view_user",
            content_type__app_label="accounts",
        )
        cls.viewer.user_permissions.add(permission)

        cls.alpha = user_manager.create_user(
            email="alpha@example.com",
            password=cls.password,
            first_name="Alpha",
            last_name="Person",
        )
        cls.beta = user_manager.create_user(
            email="beta@example.com",
            password=cls.password,
            first_name="Beta",
            last_name="Person",
        )
        cls.pending = user_manager.create_user(
            email="pending@example.com",
            password=None,
            first_name="Pending",
            last_name="Activation",
        )
        cls.inactive = user_manager.create_user(
            email="inactive@example.com",
            password=cls.password,
            is_active=False,
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def test_anonymous_user_is_rejected(self) -> None:
        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_without_permission_is_rejected(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_user_with_permission_is_allowed(self) -> None:
        self.client.force_login(self.viewer)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_superuser_is_allowed(self) -> None:
        self.client.force_login(self.superuser)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_directory_is_paginated(self) -> None:
        self.client.force_login(self.viewer)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
                {
                    "page_size": 2,
                    "page": 2,
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["page"],
            2,
        )
        self.assertEqual(
            response.data["page_size"],
            2,
        )
        self.assertEqual(
            len(response.data["results"]),
            2,
        )

    def test_directory_searches_name_and_email(self) -> None:
        self.client.force_login(self.viewer)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
                {
                    "search": "Alpha",
                },
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            response.data["total"],
            1,
        )
        self.assertEqual(
            response.data["results"][0]["email"],
            self.alpha.email,
        )

    def test_directory_ordering_is_deterministic(self) -> None:
        self.client.force_login(self.viewer)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
                {
                    "page_size": 100,
                },
            )
        )

        emails = [
            item["email"]
            for item in response.data["results"]
        ]

        self.assertEqual(
            emails,
            sorted(emails),
        )

    def test_directory_serializes_only_expected_fields_and_account_state(
        self,
    ) -> None:
        self.client.force_login(self.viewer)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
                {
                    "search": "pending@example.com",
                },
            )
        )

        item = response.data["results"][0]

        self.assertEqual(
            set(item.keys()),
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
        self.assertEqual(
            item["account_state"],
            "pending_activation",
        )
        self.assertNotIn(
            "password",
            item,
        )

    def test_inactive_account_state_is_serialized(self) -> None:
        self.client.force_login(self.viewer)

        response = as_response(
            self.client.get(
                reverse("v1:user-directory"),
                {
                    "search": "inactive@example.com",
                },
            )
        )

        self.assertEqual(
            response.data["results"][0]["account_state"],
            "inactive",
        )
