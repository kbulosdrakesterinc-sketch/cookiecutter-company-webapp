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


class RoleDirectoryAPITests(APITestCase):
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
        )
        cls.direct_viewer.user_permissions.add(
            cls.view_group_permission,
        )

        cls.viewer_role = Group.objects.create(
            name="Role Directory Viewers",
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
        cls.payroll = Group.objects.create(
            name="Payroll",
        )
        cls.viewer = Group.objects.create(
            name="Viewer",
        )

        cls.active_member = user_manager.create_user(
            email="active-member@example.com",
            password=cls.password,
        )
        cls.inactive_member = user_manager.create_user(
            email="inactive-member@example.com",
            password=cls.password,
            is_active=False,
        )
        cls.active_member.groups.add(
            cls.administrators,
        )
        cls.inactive_member.groups.add(
            cls.administrators,
        )

        permissions = list(
            Permission.objects.order_by(
                "content_type_id",
                "codename",
            )[:3]
        )
        cls.administrators.permissions.add(
            *permissions,
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def get_directory(self, **params: str) -> Response:
        return as_response(
            self.client.get(
                reverse("v1:role-directory"),
                params,
            )
        )

    def test_anonymous_user_is_rejected(self) -> None:
        response = self.get_directory()

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_without_permission_is_rejected(self) -> None:
        self.client.force_login(
            self.no_permission_user,
        )

        response = self.get_directory()

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_without_permission_is_rejected(self) -> None:
        self.client.force_login(
            self.staff_without_permission,
        )

        response = self.get_directory()

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_direct_permission_is_allowed(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_group_inherited_permission_is_allowed(self) -> None:
        self.client.force_login(
            self.group_viewer,
        )

        response = self.get_directory()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_superuser_is_allowed(self) -> None:
        self.client.force_login(
            self.superuser,
        )

        response = self.get_directory()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_role_names_are_returned(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            page_size="100",
        )

        names = {item["name"] for item in response.data["results"]}

        self.assertIn(
            "Administrators",
            names,
        )
        self.assertIn(
            "Payroll",
            names,
        )
        self.assertIn(
            "Viewer",
            names,
        )

    def test_search_filters_by_group_name(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            search="admin",
        )

        self.assertEqual(
            response.data["total"],
            1,
        )
        self.assertEqual(
            response.data["results"][0]["name"],
            "Administrators",
        )

    def test_search_trims_surrounding_whitespace(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            search="  payroll  ",
        )

        self.assertEqual(
            response.data["total"],
            1,
        )
        self.assertEqual(
            response.data["results"][0]["name"],
            "Payroll",
        )

    def test_directory_uses_expected_pagination_shape(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            page="2",
            page_size="2",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            set(response.data.keys()),
            {
                "total",
                "page",
                "page_size",
                "total_pages",
                "results",
            },
        )
        self.assertEqual(
            response.data["page"],
            2,
        )
        self.assertEqual(
            response.data["page_size"],
            2,
        )

    def test_directory_ordering_is_deterministic(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            page_size="100",
        )

        roles = [(item["name"], item["id"]) for item in response.data["results"]]

        self.assertEqual(
            roles,
            sorted(roles),
        )

    def test_response_contains_only_expected_fields(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            search="Administrators",
        )

        self.assertEqual(
            set(response.data["results"][0].keys()),
            {
                "id",
                "name",
                "user_count",
                "permission_count",
            },
        )

    def test_users_are_counted_correctly(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            search="Administrators",
        )

        self.assertEqual(
            response.data["results"][0]["user_count"],
            2,
        )

    def test_inactive_users_are_included_in_membership_count(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            search="Administrators",
        )

        self.assertEqual(
            response.data["results"][0]["user_count"],
            2,
        )

    def test_permissions_are_counted_correctly(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            search="Administrators",
        )

        self.assertEqual(
            response.data["results"][0]["permission_count"],
            3,
        )

    def test_user_and_permission_joins_do_not_multiply_counts(self) -> None:
        self.client.force_login(
            self.direct_viewer,
        )

        response = self.get_directory(
            search="Administrators",
        )
        role = response.data["results"][0]

        self.assertEqual(
            role["user_count"],
            2,
        )
        self.assertEqual(
            role["permission_count"],
            3,
        )
