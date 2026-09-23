from typing import Any, ClassVar, cast, override

from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User


def as_response(value: Any) -> Response:
    return cast(Response, value)


class RoleDetailAPITests(APITestCase):
    client: APIClient
    password: ClassVar[str] = "strong-test-password"

    @classmethod
    @override
    def setUpTestData(cls) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        cls.no_permission_user = user_manager.create_user(
            email="ordinary@example.com",
            password=cls.password,
        )
        cls.staff_without_permission = user_manager.create_user(
            email="staff@example.com",
            password=cls.password,
            is_staff=True,
        )
        cls.direct_viewer = user_manager.create_user(
            email="direct-viewer@example.com",
            password=cls.password,
        )
        cls.group_viewer = user_manager.create_user(
            email="group-viewer@example.com",
            password=cls.password,
        )
        cls.superuser = user_manager.create_superuser(
            email="superuser@example.com",
            password=cls.password,
        )

        cls.view_group_permission = Permission.objects.get(
            codename="view_group",
            content_type__app_label="auth",
            content_type__model="group",
        )
        cls.direct_viewer.user_permissions.add(
            cls.view_group_permission,
        )

        cls.viewer_role = Group.objects.create(
            name="Role Detail Viewers",
        )
        cls.viewer_role.permissions.add(
            cls.view_group_permission,
        )
        cls.group_viewer.groups.add(
            cls.viewer_role,
        )

        cls.administrators = Group.objects.create(
            name="Administrators",
        )

        cls.zeta_member = user_manager.create_user(
            email="zeta-member@example.com",
            password=cls.password,
            first_name="Zeta",
            last_name="Member",
        )
        cls.alpha_member = user_manager.create_user(
            email="alpha-member@example.com",
            password=cls.password,
            first_name="Alpha",
            last_name="Member",
            is_active=False,
        )
        cls.unassigned_user = user_manager.create_user(
            email="unassigned@example.com",
            password=cls.password,
        )
        cls.zeta_member.groups.add(cls.administrators)
        cls.alpha_member.groups.add(cls.administrators)

        cls.change_user_permission = Permission.objects.get(
            codename="change_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )
        cls.view_user_permission = Permission.objects.get(
            codename="view_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )
        cls.unrelated_permission = Permission.objects.get(
            codename="delete_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )
        cls.alpha_member.user_permissions.add(
            cls.unrelated_permission,
        )

        cls.administrators.permissions.add(
            cls.view_group_permission,
            cls.view_user_permission,
            cls.change_user_permission,
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def get_detail(self, role_id: int | None = None) -> Response:
        return as_response(
            self.client.get(
                reverse(
                    "v1:role-detail",
                    kwargs={
                        "role_id": role_id or self.administrators.pk,
                    },
                )
            )
        )

    def test_anonymous_user_is_rejected(self) -> None:
        response = self.get_detail()

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_without_permission_is_rejected(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = self.get_detail()

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_without_permission_is_rejected(self) -> None:
        self.client.force_login(self.staff_without_permission)

        response = self.get_detail()

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_direct_permission_is_allowed(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_group_inherited_permission_is_allowed(self) -> None:
        self.client.force_login(self.group_viewer)

        response = self.get_detail()

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_is_allowed(self) -> None:
        self.client.force_login(self.superuser)

        response = self.get_detail()

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_existing_group_is_returned(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.administrators.pk)
        self.assertEqual(response.data["name"], "Administrators")

    def test_unknown_group_returns_not_found(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail(role_id=999999)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_response_contains_only_expected_fields(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()

        self.assertEqual(
            set(response.data.keys()),
            {"id", "name", "users", "permissions"},
        )
        self.assertEqual(
            set(response.data["users"][0].keys()),
            {"id", "email", "first_name", "last_name", "is_active"},
        )
        self.assertEqual(
            set(response.data["permissions"][0].keys()),
            {
                "id",
                "name",
                "codename",
                "app_label",
                "model",
                "permission",
            },
        )

    def test_assigned_users_are_returned(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()
        emails = {user["email"] for user in response.data["users"]}

        self.assertEqual(
            emails,
            {"alpha-member@example.com", "zeta-member@example.com"},
        )

    def test_inactive_users_are_included(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()
        users_by_email = {user["email"]: user for user in response.data["users"]}

        self.assertFalse(
            users_by_email["alpha-member@example.com"]["is_active"],
        )

    def test_unassigned_users_are_excluded(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()
        emails = {user["email"] for user in response.data["users"]}

        self.assertNotIn(self.unassigned_user.email, emails)

    def test_directly_assigned_permissions_are_returned(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()
        permission_names = {
            permission["permission"] for permission in response.data["permissions"]
        }

        self.assertEqual(
            permission_names,
            {
                "accounts.change_user",
                "accounts.view_user",
                "auth.view_group",
            },
        )

    def test_unrelated_permissions_are_excluded(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()
        permission_ids = {
            permission["id"] for permission in response.data["permissions"]
        }

        self.assertNotIn(self.unrelated_permission.pk, permission_ids)

    def test_users_are_deterministically_ordered(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()

        self.assertEqual(
            [user["email"] for user in response.data["users"]],
            ["alpha-member@example.com", "zeta-member@example.com"],
        )

    def test_permissions_are_deterministically_ordered(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = self.get_detail()

        self.assertEqual(
            [
                (
                    permission["app_label"],
                    permission["model"],
                    permission["codename"],
                    permission["id"],
                )
                for permission in response.data["permissions"]
            ],
            sorted(
                (
                    permission["app_label"],
                    permission["model"],
                    permission["codename"],
                    permission["id"],
                )
                for permission in response.data["permissions"]
            ),
        )
