from datetime import timedelta
from typing import Any, ClassVar, cast, override

from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.audit.models import AuditEvent


def as_response(value: Any) -> Response:
    return cast(Response, value)


class AuditEventDirectoryApiTests(APITestCase):
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
            email="audit-viewer@example.com",
            password=cls.password,
        )
        cls.other_actor = user_manager.create_user(
            email="other-actor@example.com",
            password=cls.password,
        )
        cls.staff_only = user_manager.create_user(
            email="staff-only@example.com",
            password=cls.password,
            is_staff=True,
        )
        cls.superuser = user_manager.create_superuser(
            email="audit-superuser@example.com",
            password=cls.password,
        )
        cls.view_permission = Permission.objects.get(
            codename="view_auditevent",
            content_type__app_label="audit",
            content_type__model="auditevent",
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def directory_url(self) -> str:
        return reverse("v1:audit-event-directory")

    def grant_direct_permission(self, user: User) -> None:
        user.user_permissions.add(self.view_permission)

    def create_event(
        self,
        *,
        actor: User | None = None,
        actor_identifier: str | None = None,
        action: str = "admin.user.updated",
        target_type: str = "accounts.user",
        target_id: str = "target-1",
        target_display: str = "target@example.com",
        changes: dict[str, object] | None = None,
        context: dict[str, object] | None = None,
    ) -> AuditEvent:
        resolved_actor = actor if actor is not None else self.viewer
        resolved_identifier = (
            actor_identifier
            if actor_identifier is not None
            else resolved_actor.email
        )
        return AuditEvent.objects.create(
            actor=resolved_actor,
            actor_identifier=resolved_identifier,
            action=action,
            target_type=target_type,
            target_id=target_id,
            target_display=target_display,
            changes=changes or {},
            context=context or {},
        )

    def login_viewer(self) -> None:
        self.grant_direct_permission(self.viewer)
        self.client.force_login(self.viewer)

    def test_anonymous_caller_cannot_read_directory(self) -> None:
        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_caller_without_permission_is_forbidden(self) -> None:
        self.client.force_login(self.viewer)

        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_is_staff_alone_does_not_grant_access(self) -> None:
        self.client.force_login(self.staff_only)

        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_direct_permission_grants_access(self) -> None:
        self.grant_direct_permission(self.viewer)
        self.client.force_login(self.viewer)

        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_group_inherited_permission_grants_access(self) -> None:
        role = Group.objects.create(name="Audit Viewers")
        role.permissions.add(self.view_permission)
        self.viewer.groups.add(role)
        self.client.force_login(self.viewer)

        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_grants_access(self) -> None:
        self.client.force_login(self.superuser)

        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_is_newest_first(self) -> None:
        self.login_viewer()
        older = self.create_event(target_id="older")
        newer = self.create_event(target_id="newer")
        now = timezone.now()
        _ = AuditEvent.objects.filter(pk=older.pk).update(
            occurred_at=now - timedelta(minutes=2)
        )
        _ = AuditEvent.objects.filter(pk=newer.pk).update(
            occurred_at=now - timedelta(minutes=1)
        )

        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = cast(list[dict[str, object]], response.data["results"])
        self.assertEqual(
            [result["target_id"] for result in results],
            ["newer", "older"],
        )

    def test_pagination_uses_directory_contract(self) -> None:
        self.login_viewer()
        for index in range(25):
            _ = self.create_event(target_id=f"target-{index}")

        response = as_response(
            self.client.get(
                self.directory_url(),
                {"page": 2, "page_size": 10},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 25)
        self.assertEqual(response.data["page"], 2)
        self.assertEqual(response.data["page_size"], 10)
        self.assertEqual(response.data["total_pages"], 3)
        self.assertEqual(len(response.data["results"]), 10)

    def test_filters_action_target_actor_and_time_range(self) -> None:
        self.login_viewer()
        matching = self.create_event(
            actor=self.other_actor,
            action="admin.role.renamed",
            target_type="auth.group",
            target_id="17",
            target_display="Payroll",
        )
        _ = self.create_event(
            action="admin.user.updated",
            target_type="accounts.user",
            target_id="other",
        )
        occurred_at = timezone.now() - timedelta(hours=1)
        _ = AuditEvent.objects.filter(pk=matching.pk).update(
            occurred_at=occurred_at
        )

        response = as_response(
            self.client.get(
                self.directory_url(),
                {
                    "action": "admin.role.renamed",
                    "target_type": "auth.group",
                    "actor": "OTHER-ACTOR",
                    "occurred_after": (
                        occurred_at - timedelta(minutes=1)
                    ).isoformat(),
                    "occurred_before": (
                        occurred_at + timedelta(minutes=1)
                    ).isoformat(),
                },
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = cast(list[dict[str, object]], response.data["results"])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], str(matching.pk))

    def test_invalid_datetime_filter_returns_bad_request(self) -> None:
        self.login_viewer()

        response = as_response(
            self.client.get(
                self.directory_url(),
                {"occurred_after": "not-a-datetime"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("occurred_after", response.data)

    def test_inverted_time_range_returns_bad_request(self) -> None:
        self.login_viewer()
        now = timezone.now()

        response = as_response(
            self.client.get(
                self.directory_url(),
                {
                    "occurred_after": now.isoformat(),
                    "occurred_before": (now - timedelta(hours=1)).isoformat(),
                },
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("occurred_before", response.data)

    def test_changes_and_context_are_returned_without_actor_object(self) -> None:
        self.login_viewer()
        event = self.create_event(
            changes={
                "fields": {
                    "email": {
                        "from": "before@example.com",
                        "to": "after@example.com",
                    }
                }
            },
            context={"source": "administration"},
        )

        response = as_response(self.client.get(self.directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = cast(list[dict[str, object]], response.data["results"])
        serialized = next(
            result for result in results if result["id"] == str(event.pk)
        )
        self.assertEqual(serialized["changes"], event.changes)
        self.assertEqual(serialized["context"], event.context)
        self.assertEqual(
            set(serialized),
            {
                "id",
                "occurred_at",
                "actor_identifier",
                "action",
                "target_type",
                "target_id",
                "target_display",
                "changes",
                "context",
            },
        )
        self.assertNotIn("actor", serialized)

    def test_mutation_methods_do_not_exist(self) -> None:
        self.client.force_login(self.superuser)

        for method_name in ("post", "put", "patch", "delete"):
            method = getattr(self.client, method_name)
            response = as_response(
                method(
                    self.directory_url(),
                    {},
                    format="json",
                )
            )
            self.assertEqual(
                response.status_code,
                status.HTTP_405_METHOD_NOT_ALLOWED,
                method_name,
            )
