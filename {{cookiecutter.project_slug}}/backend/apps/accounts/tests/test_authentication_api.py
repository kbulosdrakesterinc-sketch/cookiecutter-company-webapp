from typing import Any, ClassVar, TypedDict, cast, override

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.accounts.services import build_account_activation_link


class CsrfResponse(TypedDict):
    csrfToken: str


class UserPayload(TypedDict):
    email: str
    roles: list[str]
    permissions: list[str]


class CurrentUserResponse(TypedDict):
    user: UserPayload


def as_response(value: Any) -> Response:
    """
    Help the type checker recognize DRF APIClient responses.
    """
    return cast(Response, value)


class AuthenticationAPITests(APITestCase):
    client: APIClient
    password: ClassVar[str]

    @classmethod
    @override
    def setUpTestData(cls) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        cls.password = "strong-test-password"

        cls.user = user_manager.create_user(
            email="user@example.com",
            password=cls.password,
            first_name="Test",
            last_name="User",
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient(
            enforce_csrf_checks=True,
        )

    def get_csrf_token(self) -> str:
        response = as_response(
            self.client.get(
                reverse("v1:accounts_api:csrf"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        response_data = cast(
            CsrfResponse,
            response.data,
        )

        return response_data["csrfToken"]

    def test_csrf_token_can_be_retrieved(self) -> None:
        response = as_response(
            self.client.get(
                reverse("v1:accounts_api:csrf"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        response_data = cast(
            CsrfResponse,
            response.data,
        )

        self.assertTrue(
            response_data["csrfToken"],
        )

    def test_user_can_log_in_with_valid_credentials(self) -> None:
        csrf_token = self.get_csrf_token()

        response = as_response(
            self.client.post(
                reverse("v1:accounts_api:login"),
                {
                    "email": self.user.email,
                    "password": self.password,
                },
                format="json",
                HTTP_X_CSRFTOKEN=csrf_token,
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        response_data = cast(
            CurrentUserResponse,
            response.data,
        )

        self.assertEqual(
            response_data["user"]["email"],
            self.user.email,
        )

        self.assertIn(
            "sessionid",
            response.cookies,
        )

    def test_login_rejects_invalid_password(self) -> None:
        csrf_token = self.get_csrf_token()

        response = as_response(
            self.client.post(
                reverse("v1:accounts_api:login"),
                {
                    "email": self.user.email,
                    "password": "incorrect-password",
                },
                format="json",
                HTTP_X_CSRFTOKEN=csrf_token,
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        response_data = cast(
            dict[str, str],
            response.data,
        )

        self.assertEqual(
            response_data["detail"],
            "Invalid email or password.",
        )

    def test_login_requires_csrf_token(self) -> None:
        response = as_response(
            self.client.post(
                reverse("v1:accounts_api:login"),
                {
                    "email": self.user.email,
                    "password": self.password,
                },
                format="json",
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_can_get_current_user(self) -> None:
        self.client.force_login(self.user)

        response = as_response(
            self.client.get(
                reverse("v1:accounts_api:current-user"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        response_data = cast(
            CurrentUserResponse,
            response.data,
        )

        self.assertEqual(
            response_data["user"]["email"],
            self.user.email,
        )

    def test_anonymous_user_cannot_get_current_user(self) -> None:
        response = as_response(
            self.client.get(
                reverse("v1:accounts_api:current-user"),
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_can_log_out(self) -> None:
        self.client.force_login(self.user)

        csrf_token = self.get_csrf_token()

        response = as_response(
            self.client.post(
                reverse("v1:accounts_api:logout"),
                HTTP_X_CSRFTOKEN=csrf_token,
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        current_user_response = as_response(
            self.client.get(
                reverse("v1:accounts_api:current-user"),
            )
        )

        self.assertEqual(
            current_user_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_provisioned_user_can_validate_activation_link(
        self,
    ) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        user = user_manager.create_user(
            email="provisioned@example.com",
            password=None,
        )

        activation = build_account_activation_link(
            user=user,
        )

        response = as_response(
            self.client.get(
                reverse(
                    "v1:accounts_api:activate-account",
                    kwargs={
                        "uid": activation.uid,
                        "token": activation.token,
                    },
                )
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_provisioned_user_can_set_initial_password(
        self,
    ) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        user = user_manager.create_user(
            email="provisioned@example.com",
            password=None,
        )

        activation = build_account_activation_link(
            user=user,
        )

        csrf_token = self.get_csrf_token()

        response = as_response(
            self.client.post(
                reverse(
                    "v1:accounts_api:activate-account",
                    kwargs={
                        "uid": activation.uid,
                        "token": activation.token,
                    },
                ),
                {
                    "password": "StrongUserPassword123!",
                    "password_confirmation": ("StrongUserPassword123!"),
                },
                format="json",
                HTTP_X_CSRFTOKEN=csrf_token,
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        user.refresh_from_db()

        self.assertTrue(
            user.check_password(
                "StrongUserPassword123!",
            )
        )

    def test_account_activation_requires_csrf(
        self,
    ) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        user = user_manager.create_user(
            email="provisioned@example.com",
            password=None,
        )

        activation = build_account_activation_link(
            user=user,
        )

        response = as_response(
            self.client.post(
                reverse(
                    "v1:accounts_api:activate-account",
                    kwargs={
                        "uid": activation.uid,
                        "token": activation.token,
                    },
                ),
                {
                    "password": "StrongUserPassword123!",
                    "password_confirmation": ("StrongUserPassword123!"),
                },
                format="json",
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_current_user_response_includes_group_role_and_permissions(
        self,
    ) -> None:
        role = Group.objects.create(
            name="Viewer",
        )

        view_user_permission = Permission.objects.get(
            codename="view_group",
            content_type__app_label="auth",
        )

        role.permissions.add(
            view_user_permission,
        )

        self.user.groups.add(
            role,
        )

        self.client.force_login(
            self.user,
        )

        response = as_response(
            self.client.get(
                reverse(
                    "v1:accounts_api:current-user",
                )
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        response_data = cast(
            CurrentUserResponse,
            response.data,
        )

        self.assertEqual(
            response_data["user"]["roles"],
            [
                "Viewer",
            ],
        )

        self.assertIn(
            "auth.view_group",
            response_data["user"]["permissions"],
        )
