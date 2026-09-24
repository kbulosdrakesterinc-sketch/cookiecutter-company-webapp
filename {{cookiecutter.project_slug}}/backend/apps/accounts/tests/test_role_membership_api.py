from typing import Any, ClassVar, cast, override
from uuid import uuid4

from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User


def as_response(value: Any) -> Response:
    return cast(Response, value)


class RoleMembershipAPITests(APITestCase):
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

        cls.change_group_permission = Permission.objects.get(
            codename="change_group",
            content_type__app_label="auth",
            content_type__model="group",
        )
        cls.role_permission = Permission.objects.get(
            codename="view_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )

        cls.direct_editor.user_permissions.add(
            cls.change_group_permission,
        )

        editor_role = Group.objects.create(
            name="Membership Editors",
        )
        editor_role.permissions.add(
            cls.change_group_permission,
        )
        cls.group_editor.groups.add(editor_role)

        cls.target_role = Group.objects.create(
            name="Payroll",
        )
        cls.target_role.permissions.add(
            cls.role_permission,
        )

        cls.alpha_member = user_manager.create_user(
            email="alpha-member@example.com",
            password=cls.password,
            first_name="Alpha",
            last_name="Member",
        )
        cls.inactive_member = user_manager.create_user(
            email="inactive-member@example.com",
            password=cls.password,
            first_name="Inactive",
            last_name="Member",
            is_active=False,
        )
        cls.alpha_member.groups.add(cls.target_role)
        cls.inactive_member.groups.add(cls.target_role)

        cls.beta_candidate = user_manager.create_user(
            email="beta-candidate@example.com",
            password=cls.password,
            first_name="Beta",
            last_name="Candidate",
        )
        cls.gamma_candidate = user_manager.create_user(
            email="gamma-candidate@example.com",
            password=cls.password,
            first_name="Gamma",
            last_name="Candidate",
        )
        cls.inactive_candidate = user_manager.create_user(
            email="inactive-candidate@example.com",
            password=cls.password,
            first_name="Inactive",
            last_name="Candidate",
            is_active=False,
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def membership_url(self, role_id: int | None = None) -> str:
        return reverse(
            "v1:role-membership",
            kwargs={"role_id": role_id or self.target_role.pk},
        )

    def candidates_url(self, role_id: int | None = None) -> str:
        return reverse(
            "v1:role-membership-candidates",
            kwargs={"role_id": role_id or self.target_role.pk},
        )

    def patch_membership(
        self,
        payload: dict[str, object],
        *,
        role_id: int | None = None,
    ) -> Response:
        return as_response(
            self.client.patch(
                self.membership_url(role_id),
                payload,
                format="json",
            )
        )

    def test_anonymous_request_is_rejected(self) -> None:
        response = self.patch_membership({})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_without_permission_is_rejected(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = self.patch_membership({})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_only_user_is_rejected(self) -> None:
        self.client.force_login(self.staff_without_permission)

        response = self.patch_membership({})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_direct_change_group_is_allowed(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership({})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_group_inherited_change_group_is_allowed(self) -> None:
        self.client.force_login(self.group_editor)

        response = self.patch_membership({})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_is_allowed(self) -> None:
        self.client.force_login(self.superuser)

        response = self.patch_membership({})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_adds_one_member(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"add_user_ids": [str(self.beta_candidate.pk)]}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            self.beta_candidate.groups.filter(pk=self.target_role.pk).exists()
        )

    def test_adds_multiple_members(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {
                "add_user_ids": [
                    str(self.beta_candidate.pk),
                    str(self.gamma_candidate.pk),
                ]
            }
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            self.beta_candidate.groups.filter(pk=self.target_role.pk).exists()
        )
        self.assertTrue(
            self.gamma_candidate.groups.filter(pk=self.target_role.pk).exists()
        )

    def test_removes_one_member(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"remove_user_ids": [str(self.alpha_member.pk)]}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            self.alpha_member.groups.filter(pk=self.target_role.pk).exists()
        )

    def test_adding_existing_member_is_idempotent(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"add_user_ids": [str(self.alpha_member.pk)]}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.alpha_member.groups.filter(pk=self.target_role.pk).count(),
            1,
        )

    def test_removing_non_member_is_idempotent(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"remove_user_ids": [str(self.beta_candidate.pk)]}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            self.beta_candidate.groups.filter(pk=self.target_role.pk).exists()
        )

    def test_unrelated_members_remain_unchanged(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"remove_user_ids": [str(self.alpha_member.pk)]}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            self.inactive_member.groups.filter(pk=self.target_role.pk).exists()
        )

    def test_role_permissions_remain_unchanged(self) -> None:
        self.client.force_login(self.direct_editor)
        original_permission_ids = set(
            self.target_role.permissions.values_list("pk", flat=True)
        )

        response = self.patch_membership(
            {"add_user_ids": [str(self.beta_candidate.pk)]}
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(self.target_role.permissions.values_list("pk", flat=True)),
            original_permission_ids,
        )

    def test_role_name_remains_unchanged(self) -> None:
        self.client.force_login(self.direct_editor)
        original_name = self.target_role.name

        response = self.patch_membership(
            {"add_user_ids": [str(self.beta_candidate.pk)]}
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.target_role.name, original_name)

    def test_role_fields_are_rejected_on_membership_endpoint(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {
                "name": "Changed",
                "permission_ids": [],
            }
        )
        self.target_role.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)
        self.assertIn("permission_ids", response.data)
        self.assertEqual(self.target_role.name, "Payroll")
        self.assertTrue(
            self.target_role.permissions.filter(pk=self.role_permission.pk).exists()
        )

    def test_invalid_user_id_returns_useful_validation(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"add_user_ids": [str(uuid4())]}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user_ids", response.data)

    def test_mixed_valid_and_invalid_ids_roll_back_completely(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {
                "add_user_ids": [
                    str(self.beta_candidate.pk),
                    str(uuid4()),
                ]
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            self.beta_candidate.groups.filter(pk=self.target_role.pk).exists()
        )

    def test_same_user_in_add_and_remove_is_rejected(self) -> None:
        self.client.force_login(self.direct_editor)
        user_id = str(self.alpha_member.pk)

        response = self.patch_membership(
            {
                "add_user_ids": [user_id],
                "remove_user_ids": [user_id],
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("add_user_ids", response.data)
        self.assertIn("remove_user_ids", response.data)

    def test_missing_role_returns_404(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {},
            role_id=999999999,
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assigned_users_are_returned_in_deterministic_order(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"add_user_ids": [str(self.beta_candidate.pk)]}
        )

        self.assertEqual(
            [user["email"] for user in response.data["users"]],
            [
                "alpha-member@example.com",
                "beta-candidate@example.com",
                "inactive-member@example.com",
            ],
        )

    def test_inactive_assigned_user_remains_visible(self) -> None:
        self.client.force_login(self.direct_editor)

        response = self.patch_membership(
            {"add_user_ids": [str(self.beta_candidate.pk)]}
        )
        users_by_email = {
            user["email"]: user
            for user in response.data["users"]
        }

        self.assertFalse(
            users_by_email["inactive-member@example.com"]["is_active"]
        )

    def test_candidate_search_requires_change_group(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = as_response(
            self.client.get(
                self.candidates_url(),
                {"search": "Candidate"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_candidate_search_allows_group_inherited_change_group(self) -> None:
        self.client.force_login(self.group_editor)

        response = as_response(
            self.client.get(
                self.candidates_url(),
                {"search": "Candidate"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_candidate_search_excludes_existing_members(self) -> None:
        self.client.force_login(self.direct_editor)

        response = as_response(
            self.client.get(
                self.candidates_url(),
                {"search": "member"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])

    def test_candidate_searches_name_and_email_deterministically(self) -> None:
        self.client.force_login(self.direct_editor)

        response = as_response(
            self.client.get(
                self.candidates_url(),
                {"search": "Candidate"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["email"] for item in response.data["results"]],
            [
                "beta-candidate@example.com",
                "gamma-candidate@example.com",
                "inactive-candidate@example.com",
            ],
        )

    def test_candidate_search_includes_inactive_state(self) -> None:
        self.client.force_login(self.direct_editor)

        response = as_response(
            self.client.get(
                self.candidates_url(),
                {"search": "inactive-candidate@example.com"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 1)
        self.assertFalse(response.data["results"][0]["is_active"])

    def test_blank_candidate_search_does_not_load_user_catalog(self) -> None:
        self.client.force_login(self.direct_editor)

        response = as_response(
            self.client.get(
                self.candidates_url(),
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 0)
        self.assertEqual(response.data["results"], [])

    def test_candidate_search_missing_role_returns_404(self) -> None:
        self.client.force_login(self.direct_editor)

        response = as_response(
            self.client.get(
                self.candidates_url(role_id=999999999),
                {"search": "Candidate"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
