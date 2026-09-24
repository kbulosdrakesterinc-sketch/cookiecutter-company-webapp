from typing import Any, ClassVar, cast, override

from django.contrib.auth.models import Group, Permission
from django.db import transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.accounts.services import update_user
from apps.audit.models import AuditEvent
from apps.audit.services import AuditAction, AuditTarget


def as_response(value: Any) -> Response:
    return cast(Response, value)


class AdministrationAuditTests(APITestCase):
    client: APIClient
    password: ClassVar[str] = "strong-test-password"

    @classmethod
    @override
    def setUpTestData(cls) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )

        cls.actor = user_manager.create_superuser(
            email="audit-admin@example.com",
            password=cls.password,
        )
        cls.target_user = user_manager.create_user(
            email="target-user@example.com",
            password=cls.password,
            first_name="Target",
            last_name="User",
        )
        cls.member_a = user_manager.create_user(
            email="member-a@example.com",
            password=cls.password,
        )
        cls.member_b = user_manager.create_user(
            email="member-b@example.com",
            password=cls.password,
        )
        cls.candidate_a = user_manager.create_user(
            email="candidate-a@example.com",
            password=cls.password,
        )
        cls.candidate_b = user_manager.create_user(
            email="candidate-b@example.com",
            password=cls.password,
        )

        cls.initial_permission = Permission.objects.get(
            codename="view_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )
        cls.added_permission_a = Permission.objects.get(
            codename="change_user",
            content_type__app_label="accounts",
            content_type__model="user",
        )
        cls.added_permission_b = Permission.objects.get(
            codename="view_group",
            content_type__app_label="auth",
            content_type__model="group",
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()
        self.client.force_login(self.actor)

    def user_directory_url(self) -> str:
        return reverse("v1:user-directory")

    def user_detail_url(self, user: User | None = None) -> str:
        target = user or self.target_user
        return reverse(
            "v1:user-detail",
            kwargs={"user_id": target.pk},
        )

    def role_directory_url(self) -> str:
        return reverse("v1:role-directory")

    def role_detail_url(self, role: Group) -> str:
        return reverse(
            "v1:role-detail",
            kwargs={"role_id": role.pk},
        )

    def role_membership_url(self, role: Group) -> str:
        return reverse(
            "v1:role-membership",
            kwargs={"role_id": role.pk},
        )

    def test_user_provisioning_creates_structured_audit_event(self) -> None:
        response = as_response(
            self.client.post(
                self.user_directory_url(),
                {
                    "email": "new-user@example.com",
                    "first_name": "New",
                    "last_name": "User",
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(email="new-user@example.com")
        event = AuditEvent.objects.get(action=AuditAction.USER_PROVISIONED)

        self.assertEqual(event.actor, self.actor)
        self.assertEqual(event.actor_identifier, self.actor.email)
        self.assertEqual(event.target_type, AuditTarget.USER)
        self.assertEqual(event.target_id, str(created_user.pk))
        self.assertEqual(event.target_display, created_user.email)
        self.assertIsNotNone(event.occurred_at)
        self.assertEqual(
            event.changes,
            {
                "fields": {
                    "email": {"to": "new-user@example.com"},
                    "first_name": {"to": "New"},
                    "last_name": {"to": "User"},
                    "is_active": {"to": True},
                }
            },
        )
        self.assertEqual(event.context, {})

    def test_user_update_audits_only_actual_profile_changes(self) -> None:
        response = as_response(
            self.client.patch(
                self.user_detail_url(),
                {
                    "email": "updated-target@example.com",
                    "first_name": "Updated",
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = AuditEvent.objects.get(action=AuditAction.USER_UPDATED)
        self.assertEqual(
            event.changes,
            {
                "fields": {
                    "email": {
                        "from": "target-user@example.com",
                        "to": "updated-target@example.com",
                    },
                    "first_name": {
                        "from": "Target",
                        "to": "Updated",
                    },
                }
            },
        )

        response = as_response(
            self.client.patch(
                self.user_detail_url(),
                {
                    "email": "updated-target@example.com",
                    "first_name": "Updated",
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            AuditEvent.objects.filter(action=AuditAction.USER_UPDATED).count(),
            1,
        )

    def test_user_activation_and_deactivation_are_recorded(self) -> None:
        deactivate_response = as_response(
            self.client.patch(
                self.user_detail_url(),
                {"is_active": False},
                format="json",
            )
        )
        activate_response = as_response(
            self.client.patch(
                self.user_detail_url(),
                {"is_active": True},
                format="json",
            )
        )

        self.assertEqual(deactivate_response.status_code, status.HTTP_200_OK)
        self.assertEqual(activate_response.status_code, status.HTTP_200_OK)

        deactivated = AuditEvent.objects.get(
            action=AuditAction.USER_DEACTIVATED,
        )
        activated = AuditEvent.objects.get(
            action=AuditAction.USER_ACTIVATED,
        )
        self.assertEqual(
            deactivated.changes,
            {"fields": {"is_active": {"from": True, "to": False}}},
        )
        self.assertEqual(
            activated.changes,
            {"fields": {"is_active": {"from": False, "to": True}}},
        )

    def test_role_creation_is_recorded(self) -> None:
        response = as_response(
            self.client.post(
                self.role_directory_url(),
                {
                    "name": "Audited Role",
                    "permission_ids": [self.initial_permission.pk],
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        role = Group.objects.get(name="Audited Role")
        event = AuditEvent.objects.get(action=AuditAction.ROLE_CREATED)

        self.assertEqual(event.actor, self.actor)
        self.assertEqual(event.target_type, AuditTarget.ROLE)
        self.assertEqual(event.target_id, str(role.pk))
        self.assertEqual(event.target_display, role.name)
        self.assertEqual(event.changes["fields"], {"name": {"to": role.name}})
        added = cast(
            list[dict[str, object]],
            cast(dict[str, object], event.changes["direct_permissions"])["added"],
        )
        self.assertEqual(
            [entry["id"] for entry in added],
            [self.initial_permission.pk],
        )

    def test_role_rename_is_recorded_only_for_an_actual_change(self) -> None:
        role = Group.objects.create(name="Before Rename")

        response = as_response(
            self.client.patch(
                self.role_detail_url(role),
                {"name": "After Rename"},
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = AuditEvent.objects.get(action=AuditAction.ROLE_RENAMED)
        self.assertEqual(
            event.changes,
            {
                "fields": {
                    "name": {
                        "from": "Before Rename",
                        "to": "After Rename",
                    }
                }
            },
        )

        response = as_response(
            self.client.patch(
                self.role_detail_url(role),
                {"name": "After Rename"},
                format="json",
            )
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            AuditEvent.objects.filter(action=AuditAction.ROLE_RENAMED).count(),
            1,
        )

    def test_role_permission_changes_are_deterministic(self) -> None:
        role = Group.objects.create(name="Permission Role")
        role.permissions.add(self.initial_permission)
        requested = sorted(
            [self.added_permission_a.pk, self.added_permission_b.pk],
            reverse=True,
        )

        response = as_response(
            self.client.patch(
                self.role_detail_url(role),
                {"permission_ids": requested},
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = AuditEvent.objects.get(
            action=AuditAction.ROLE_PERMISSIONS_CHANGED,
        )
        changes = cast(
            dict[str, list[dict[str, object]]],
            event.changes["direct_permissions"],
        )
        self.assertEqual(
            [entry["id"] for entry in changes["added"]],
            sorted([self.added_permission_a.pk, self.added_permission_b.pk]),
        )
        self.assertEqual(
            [entry["id"] for entry in changes["removed"]],
            [self.initial_permission.pk],
        )
        self.assertTrue(
            all("name" in entry and "permission" in entry for entry in changes["added"])
        )

    def test_role_membership_changes_are_deterministic(self) -> None:
        role = Group.objects.create(name="Membership Role")
        self.member_a.groups.add(role)
        self.member_b.groups.add(role)
        add_ids = sorted(
            [str(self.candidate_a.pk), str(self.candidate_b.pk)],
            reverse=True,
        )
        remove_ids = sorted(
            [str(self.member_a.pk), str(self.member_b.pk)],
            reverse=True,
        )

        response = as_response(
            self.client.patch(
                self.role_membership_url(role),
                {
                    "add_user_ids": add_ids,
                    "remove_user_ids": remove_ids,
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = AuditEvent.objects.get(
            action=AuditAction.ROLE_MEMBERSHIP_CHANGED,
        )
        changes = cast(
            dict[str, list[dict[str, object]]],
            event.changes["members"],
        )
        self.assertEqual(
            [entry["id"] for entry in changes["added"]],
            sorted(add_ids),
        )
        self.assertEqual(
            [entry["id"] for entry in changes["removed"]],
            sorted(remove_ids),
        )
        self.assertEqual(
            {entry["email"] for entry in changes["added"]},
            {self.candidate_a.email, self.candidate_b.email},
        )

    def test_idempotent_membership_request_does_not_create_event(self) -> None:
        role = Group.objects.create(name="Idempotent Membership Role")
        self.member_a.groups.add(role)

        response = as_response(
            self.client.patch(
                self.role_membership_url(role),
                {
                    "add_user_ids": [str(self.member_a.pk)],
                    "remove_user_ids": [str(self.candidate_a.pk)],
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            AuditEvent.objects.filter(
                action=AuditAction.ROLE_MEMBERSHIP_CHANGED,
            ).exists()
        )

    def test_failed_validation_does_not_create_audit_event(self) -> None:
        response = as_response(
            self.client.post(
                self.user_directory_url(),
                {"email": "not-an-email"},
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AuditEvent.objects.exists())

    def test_rolled_back_mutation_does_not_leave_audit_event(self) -> None:
        original_first_name = self.target_user.first_name

        with self.assertRaises(RuntimeError):
            with transaction.atomic():
                _ = update_user(
                    actor=self.actor,
                    user_id=self.target_user.pk,
                    first_name="Rolled Back",
                )
                raise RuntimeError("force rollback")

        self.target_user.refresh_from_db()
        self.assertEqual(self.target_user.first_name, original_first_name)
        self.assertFalse(AuditEvent.objects.exists())

    def test_unrelated_read_operation_does_not_create_audit_event(self) -> None:
        response = as_response(
            self.client.get(self.user_directory_url())
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(AuditEvent.objects.exists())

    def test_sensitive_fields_are_not_persisted(self) -> None:
        response = as_response(
            self.client.post(
                self.user_directory_url(),
                {
                    "email": "safe-audit@example.com",
                    "first_name": "Safe",
                    "last_name": "Audit",
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = AuditEvent.objects.get(action=AuditAction.USER_PROVISIONED)
        fields = cast(dict[str, object], event.changes["fields"])

        self.assertEqual(
            set(fields),
            {"email", "first_name", "last_name", "is_active"},
        )
        self.assertEqual(event.context, {})
        for forbidden in (
            "password",
            "password_confirmation",
            "session",
            "csrf",
            "authorization",
            "activation_token",
        ):
            self.assertNotIn(forbidden, fields)
            self.assertNotIn(forbidden, event.context)

    def test_actor_deletion_preserves_historical_event(self) -> None:
        user_manager = cast(
            UserManager[User],
            cast(object, User.objects),
        )
        temporary_actor = user_manager.create_user(
            email="temporary-actor@example.com",
            password=self.password,
        )
        actor_email = temporary_actor.email

        _ = update_user(
            actor=temporary_actor,
            user_id=self.target_user.pk,
            first_name="Preserved History",
        )
        event = AuditEvent.objects.get(action=AuditAction.USER_UPDATED)

        temporary_actor.delete()
        event.refresh_from_db()

        self.assertIsNone(event.actor)
        self.assertEqual(event.actor_identifier, actor_email)
        self.assertEqual(event.target_id, str(self.target_user.pk))
