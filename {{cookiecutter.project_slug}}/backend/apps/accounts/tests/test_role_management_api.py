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


class RoleManagementAPITests(APITestCase):
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
        cls.direct_creator = user_manager.create_user(
            email="direct-creator@example.com",
            password=cls.password,
        )
        cls.group_creator = user_manager.create_user(
            email="group-creator@example.com",
            password=cls.password,
        )
        cls.direct_editor = user_manager.create_user(
            email="direct-editor@example.com",
            password=cls.password,
        )
        cls.group_editor = user_manager.create_user(
            email="group-editor@example.com",
            password=cls.password,
        )
        cls.superuser = user_manager.create_superuser(
            email="superuser@example.com",
            password=cls.password,
        )

        cls.add_group_permission = Permission.objects.get(
            codename="add_group",
            content_type__app_label="auth",
            content_type__model="group",
        )
        cls.change_group_permission = Permission.objects.get(
            codename="change_group",
            content_type__app_label="auth",
            content_type__model="group",
        )
        cls.view_group_permission = Permission.objects.get(
            codename="view_group",
            content_type__app_label="auth",
            content_type__model="group",
        )
        cls.view_permission_permission = Permission.objects.get(
            codename="view_permission",
            content_type__app_label="auth",
            content_type__model="permission",
        )

        cls.permission_one = Permission.objects.get(
            codename="view_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )
        cls.permission_two = Permission.objects.get(
            codename="change_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )
        cls.unrelated_permission = Permission.objects.get(
            codename="delete_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )

        cls.direct_creator.user_permissions.add(cls.add_group_permission)
        cls.direct_editor.user_permissions.add(cls.change_group_permission)

        creator_role = Group.objects.create(name="Role Creators")
        creator_role.permissions.add(cls.add_group_permission)
        cls.group_creator.groups.add(creator_role)

        editor_role = Group.objects.create(name="Role Editors")
        editor_role.permissions.add(cls.change_group_permission)
        cls.group_editor.groups.add(editor_role)

        cls.target_role = Group.objects.create(name="Payroll")
        cls.target_role.permissions.add(
            cls.permission_one,
            cls.permission_two,
        )
        cls.other_role = Group.objects.create(name="Operations")

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def create_url(self) -> str:
        return reverse("v1:role-directory")

    def detail_url(self, role_id: int | None = None) -> str:
        return reverse(
            "v1:role-detail",
            kwargs={"role_id": role_id or self.target_role.pk},
        )

    def permission_catalog_url(self) -> str:
        return reverse("v1:permission-catalog")

    def post_role(self, payload: dict[str, object]) -> Response:
        return as_response(
            self.client.post(
                self.create_url(),
                payload,
                format="json",
            )
        )

    def patch_role(
        self,
        payload: dict[str, object],
        *,
        role_id: int | None = None,
    ) -> Response:
        return as_response(
            self.client.patch(
                self.detail_url(role_id),
                payload,
                format="json",
            )
        )

    def test_create_anonymous_is_rejected(self) -> None:
        response = self.post_role({"name": "Finance"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_without_add_group_is_rejected(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = self.post_role({"name": "Finance"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_staff_only_is_rejected(self) -> None:
        self.client.force_login(self.staff_without_permission)

        response = self.post_role({"name": "Finance"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_direct_add_group_can_create(self) -> None:
        self.client.force_login(self.direct_creator)

        response = self.post_role({"name": "Finance"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_group_inherited_add_group_can_create(self) -> None:
        self.client.force_login(self.group_creator)

        response = self.post_role({"name": "Finance"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_create(self) -> None:
        self.client.force_login(self.superuser)

        response = self.post_role({"name": "Finance"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_valid_role_is_created_with_direct_permissions(self) -> None:
        self.client.force_login(self.direct_creator)

        response = self.post_role(
            {
                "name": "  Finance  ",
                "permission_ids": [
                    self.permission_one.pk,
                    self.permission_two.pk,
                ],
            }
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        role = Group.objects.get(name="Finance")
        self.assertEqual(
            set(role.permissions.values_list("pk", flat=True)),
            {self.permission_one.pk, self.permission_two.pk},
        )
        self.assertEqual(response.data["name"], "Finance")

    def test_duplicate_role_name_is_rejected_cleanly(self) -> None:
        self.client.force_login(self.direct_creator)

        response = self.post_role({"name": self.target_role.name})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_invalid_create_permission_ids_are_rejected_without_creating_role(self) -> None:
        self.client.force_login(self.direct_creator)

        response = self.post_role(
            {
                "name": "Finance",
                "permission_ids": [999999999],
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("permission_ids", response.data)
        self.assertFalse(Group.objects.filter(name="Finance").exists())

    def test_update_anonymous_is_rejected(self) -> None:
        response = self.patch_role({"name": "Updated Payroll"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_without_change_group_is_rejected(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = self.patch_role({"name": "Updated Payroll"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_staff_only_is_rejected(self) -> None:
        self.client.force_login(self.staff_without_permission)

        response = self.patch_role({"name": "Updated Payroll"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_direct_change_group_can_update(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role({"name": "Updated Payroll"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_group_inherited_change_group_can_update(self) -> None:
        self.client.force_login(self.group_editor)

        response = self.patch_role({"name": "Updated Payroll"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_update(self) -> None:
        self.client.force_login(self.superuser)

        response = self.patch_role({"name": "Updated Payroll"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_role_name_can_change(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role({"name": "  Payroll Managers  "})
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.target_role.name, "Payroll Managers")
        self.assertEqual(response.data["name"], "Payroll Managers")

    def test_direct_permissions_are_replaced_exactly(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role(
            {"permission_ids": [self.unrelated_permission.pk]}
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(self.target_role.permissions.values_list("pk", flat=True)),
            {self.unrelated_permission.pk},
        )
        returned_ids = {
            permission["id"] for permission in response.data["permissions"]
        }
        self.assertEqual(returned_ids, {self.unrelated_permission.pk})

    def test_removed_permissions_are_actually_removed(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role(
            {"permission_ids": [self.permission_one.pk]}
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            self.target_role.permissions.filter(pk=self.permission_one.pk).exists()
        )
        self.assertFalse(
            self.target_role.permissions.filter(pk=self.permission_two.pk).exists()
        )

    def test_unrelated_permissions_are_not_added(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role(
            {"permission_ids": [self.permission_one.pk]}
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            self.target_role.permissions.filter(
                pk=self.unrelated_permission.pk
            ).exists()
        )

    def test_empty_permission_list_clears_direct_permissions(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role({"permission_ids": []})
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.target_role.permissions.count(), 0)

    def test_omitted_permission_ids_preserve_existing_permissions(self) -> None:
        self.client.force_login(self.direct_editor)
        original_ids = set(
            self.target_role.permissions.values_list("pk", flat=True)
        )

        response = self.patch_role({"name": "Payroll Managers"})
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(self.target_role.permissions.values_list("pk", flat=True)),
            original_ids,
        )

    def test_invalid_permission_ids_are_rejected(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role({"permission_ids": [999999999]})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("permission_ids", response.data)

    def test_failed_update_does_not_partially_modify_group(self) -> None:
        self.client.force_login(self.direct_editor)
        original_name = self.target_role.name
        original_permission_ids = set(
            self.target_role.permissions.values_list("pk", flat=True)
        )

        response = self.patch_role(
            {
                "name": "Should Roll Back",
                "permission_ids": [999999999],
            }
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.target_role.name, original_name)
        self.assertEqual(
            set(self.target_role.permissions.values_list("pk", flat=True)),
            original_permission_ids,
        )

    def test_duplicate_name_update_does_not_change_permissions(self) -> None:
        self.client.force_login(self.direct_editor)
        original_permission_ids = set(
            self.target_role.permissions.values_list("pk", flat=True)
        )

        response = self.patch_role(
            {
                "name": self.other_role.name,
                "permission_ids": [self.unrelated_permission.pk],
            }
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)
        self.assertEqual(self.target_role.name, "Payroll")
        self.assertEqual(
            set(self.target_role.permissions.values_list("pk", flat=True)),
            original_permission_ids,
        )

    def test_missing_role_returns_404(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role(
            {"name": "Missing"},
            role_id=999999999,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_membership_fields_cannot_be_modified(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_role({"user_ids": []})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user_ids", response.data)

    def test_permission_catalog_requires_role_management_permission(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = as_response(self.client.get(self.permission_catalog_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_only_cannot_view_permission_catalog(self) -> None:
        self.client.force_login(self.staff_without_permission)

        response = as_response(self.client.get(self.permission_catalog_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_group_allows_permission_catalog_without_view_permission(self) -> None:
        self.assertFalse(
            self.direct_creator.has_perm("auth.view_permission")
        )
        self.client.force_login(self.direct_creator)

        response = as_response(self.client.get(self.permission_catalog_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_group_allows_permission_catalog_without_view_permission(self) -> None:
        self.assertFalse(
            self.direct_editor.has_perm("auth.view_permission")
        )
        self.client.force_login(self.direct_editor)

        response = as_response(self.client.get(self.permission_catalog_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_permission_catalog_shape_and_order_are_deterministic(self) -> None:
        self.client.force_login(self.direct_editor)

        response = as_response(self.client.get(self.permission_catalog_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertEqual(
            set(response.data[0].keys()),
            {
                "id",
                "name",
                "codename",
                "app_label",
                "model",
                "permission",
            },
        )
        ordering = [
            (
                item["app_label"],
                item["model"],
                item["codename"],
                item["id"],
            )
            for item in response.data
        ]
        self.assertEqual(ordering, sorted(ordering))
