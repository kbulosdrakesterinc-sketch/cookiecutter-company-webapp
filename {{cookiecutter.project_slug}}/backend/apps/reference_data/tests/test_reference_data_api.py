from typing import Any, ClassVar, cast, override

from django.contrib.auth.models import Group, Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APITestCase

from apps.accounts.managers import UserManager
from apps.accounts.models import User
from apps.audit.models import AuditEvent
from apps.audit.services import AuditAction, AuditTarget
from apps.reference_data.models import ReferenceDataSet, ReferenceDataValue
from apps.reference_data.queries import get_active_reference_data_values


def as_response(value: Any) -> Response:
    return cast(Response, value)


class ReferenceDataApiTests(APITestCase):
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
        cls.staff_only = user_manager.create_user(
            email="staff-only@example.com",
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
        cls.creator = user_manager.create_user(
            email="creator@example.com",
            password=cls.password,
        )
        cls.editor = user_manager.create_user(
            email="editor@example.com",
            password=cls.password,
        )
        cls.value_creator = user_manager.create_user(
            email="value-creator@example.com",
            password=cls.password,
        )
        cls.value_editor = user_manager.create_user(
            email="value-editor@example.com",
            password=cls.password,
        )
        cls.superuser = user_manager.create_superuser(
            email="superuser@example.com",
            password=cls.password,
        )

        cls.view_set_permission = Permission.objects.get(
            codename="view_referencedataset",
            content_type__app_label="reference_data",
            content_type__model="referencedataset",
        )
        cls.add_set_permission = Permission.objects.get(
            codename="add_referencedataset",
            content_type__app_label="reference_data",
            content_type__model="referencedataset",
        )
        cls.change_set_permission = Permission.objects.get(
            codename="change_referencedataset",
            content_type__app_label="reference_data",
            content_type__model="referencedataset",
        )
        cls.add_value_permission = Permission.objects.get(
            codename="add_referencedatavalue",
            content_type__app_label="reference_data",
            content_type__model="referencedatavalue",
        )
        cls.change_value_permission = Permission.objects.get(
            codename="change_referencedatavalue",
            content_type__app_label="reference_data",
            content_type__model="referencedatavalue",
        )

        cls.direct_viewer.user_permissions.add(cls.view_set_permission)
        cls.creator.user_permissions.add(
            cls.view_set_permission,
            cls.add_set_permission,
        )
        cls.editor.user_permissions.add(
            cls.view_set_permission,
            cls.change_set_permission,
        )
        cls.value_creator.user_permissions.add(
            cls.view_set_permission,
            cls.add_value_permission,
        )
        cls.value_editor.user_permissions.add(
            cls.view_set_permission,
            cls.change_value_permission,
        )

        viewer_role = Group.objects.create(name="Reference Data Viewers")
        viewer_role.permissions.add(cls.view_set_permission)
        cls.group_viewer.groups.add(viewer_role)

        cls.primary_set = ReferenceDataSet.objects.create(
            code="GENERAL",
            name="General lookup",
            description="Reusable lookup values.",
        )
        cls.secondary_set = ReferenceDataSet.objects.create(
            code="SECONDARY",
            name="Secondary lookup",
            description="Another lookup set.",
        )
        cls.alpha = ReferenceDataValue.objects.create(
            reference_set=cls.primary_set,
            code="ALPHA",
            name="Alpha",
            description="First value",
            sort_order=10,
        )
        cls.beta = ReferenceDataValue.objects.create(
            reference_set=cls.primary_set,
            code="BETA",
            name="Beta",
            description="Second value",
            sort_order=20,
        )

    @override
    def setUp(self) -> None:
        self.client = APIClient()

    def set_directory_url(self) -> str:
        return reverse("v1:reference-data-set-directory")

    def set_detail_url(
        self,
        reference_set: ReferenceDataSet | None = None,
    ) -> str:
        target = reference_set or self.primary_set
        return reverse(
            "v1:reference-data-set-detail",
            kwargs={"reference_set_id": target.pk},
        )

    def value_directory_url(
        self,
        reference_set: ReferenceDataSet | None = None,
    ) -> str:
        target = reference_set or self.primary_set
        return reverse(
            "v1:reference-data-value-directory",
            kwargs={"reference_set_id": target.pk},
        )

    def value_detail_url(
        self,
        value: ReferenceDataValue | None = None,
        reference_set: ReferenceDataSet | None = None,
    ) -> str:
        target_value = value or self.alpha
        target_set = reference_set or self.primary_set
        return reverse(
            "v1:reference-data-value-detail",
            kwargs={
                "reference_set_id": target_set.pk,
                "value_id": target_value.pk,
            },
        )

    def test_anonymous_listing_is_rejected(self) -> None:
        response = as_response(self.client.get(self.set_directory_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_without_permission_is_rejected(self) -> None:
        self.client.force_login(self.no_permission_user)

        response = as_response(self.client.get(self.set_directory_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_is_staff_alone_does_not_grant_access(self) -> None:
        self.client.force_login(self.staff_only)

        response = as_response(self.client.get(self.set_directory_url()))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_direct_permission_grants_access(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = as_response(self.client.get(self.set_directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_group_inherited_permission_grants_access(self) -> None:
        self.client.force_login(self.group_viewer)

        response = as_response(self.client.get(self.set_directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_permission_grants_access(self) -> None:
        self.client.force_login(self.superuser)

        response = as_response(self.client.get(self.set_directory_url()))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_set_listing_search_and_pagination_are_deterministic(self) -> None:
        self.client.force_login(self.direct_viewer)
        _ = ReferenceDataSet.objects.create(
            code="THIRD",
            name="Third lookup",
        )

        search_response = as_response(
            self.client.get(
                self.set_directory_url(),
                {"search": "secondary"},
            )
        )
        page_response = as_response(
            self.client.get(
                self.set_directory_url(),
                {"page": 2, "page_size": 2},
            )
        )

        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertEqual(search_response.data["total"], 1)
        self.assertEqual(
            search_response.data["results"][0]["code"],
            "SECONDARY",
        )
        self.assertEqual(page_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(page_response.data),
            {
                "total",
                "page",
                "page_size",
                "total_pages",
                "results",
            },
        )
        self.assertEqual(page_response.data["page"], 2)
        self.assertEqual(page_response.data["page_size"], 2)
        self.assertEqual(page_response.data["total"], 3)
        self.assertEqual(page_response.data["total_pages"], 2)

    def test_set_listing_filters_by_active_state(self) -> None:
        self.secondary_set.is_active = False
        self.secondary_set.save(update_fields=["is_active"])
        self.client.force_login(self.direct_viewer)

        response = as_response(
            self.client.get(
                self.set_directory_url(),
                {"is_active": "false"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["results"][0]["code"], "SECONDARY")

    def test_invalid_active_filter_is_rejected(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = as_response(
            self.client.get(
                self.set_directory_url(),
                {"is_active": "sometimes"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("is_active", response.data)

    def test_set_response_contains_expected_fields_and_value_count(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = as_response(
            self.client.get(
                self.set_directory_url(),
                {"search": "GENERAL"},
            )
        )

        item = response.data["results"][0]
        self.assertEqual(
            set(item),
            {
                "id",
                "code",
                "name",
                "description",
                "is_active",
                "value_count",
                "created_at",
                "updated_at",
            },
        )
        self.assertEqual(item["value_count"], 2)

    def test_successful_set_creation_normalizes_code_and_audits(self) -> None:
        self.client.force_login(self.creator)

        response = as_response(
            self.client.post(
                self.set_directory_url(),
                {
                    "code": " finance ",
                    "name": " Finance ",
                    "description": " Shared finance lookup ",
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        reference_set = ReferenceDataSet.objects.get(code="FINANCE")
        self.assertEqual(reference_set.name, "Finance")
        event = AuditEvent.objects.get(
            action=AuditAction.REFERENCE_DATA_SET_CREATED,
        )
        self.assertEqual(event.actor, self.creator)
        self.assertEqual(event.target_type, AuditTarget.REFERENCE_DATA_SET)
        self.assertEqual(event.target_id, str(reference_set.pk))
        self.assertEqual(
            event.changes["fields"]["code"],
            {"to": "FINANCE"},
        )

    def test_set_creation_requires_add_permission(self) -> None:
        self.client.force_login(self.direct_viewer)

        response = as_response(
            self.client.post(
                self.set_directory_url(),
                {"code": "FINANCE", "name": "Finance"},
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_set_validation_failure_creates_no_audit_event(self) -> None:
        self.client.force_login(self.creator)

        response = as_response(
            self.client.post(
                self.set_directory_url(),
                {"code": "not valid!", "name": "Invalid"},
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", response.data)
        self.assertFalse(AuditEvent.objects.exists())

    def test_duplicate_set_code_is_rejected_without_audit(self) -> None:
        self.client.force_login(self.creator)

        response = as_response(
            self.client.post(
                self.set_directory_url(),
                {"code": "general", "name": "Duplicate"},
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", response.data)
        self.assertFalse(AuditEvent.objects.exists())

    def test_successful_set_edit_records_only_actual_fields(self) -> None:
        self.client.force_login(self.editor)

        response = as_response(
            self.client.patch(
                self.set_detail_url(),
                {
                    "name": " Updated lookup ",
                    "description": " Updated description ",
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.primary_set.refresh_from_db()
        self.assertEqual(self.primary_set.name, "Updated lookup")
        event = AuditEvent.objects.get(
            action=AuditAction.REFERENCE_DATA_SET_UPDATED,
        )
        self.assertEqual(
            event.changes,
            {
                "fields": {
                    "name": {
                        "from": "General lookup",
                        "to": "Updated lookup",
                    },
                    "description": {
                        "from": "Reusable lookup values.",
                        "to": "Updated description",
                    },
                }
            },
        )

    def test_set_code_is_immutable_after_creation(self) -> None:
        self.client.force_login(self.editor)

        response = as_response(
            self.client.patch(
                self.set_detail_url(),
                {"code": "RENAMED"},
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", response.data)
        self.primary_set.refresh_from_db()
        self.assertEqual(self.primary_set.code, "GENERAL")
        self.assertFalse(AuditEvent.objects.exists())

    def test_set_activate_deactivate_and_idempotent_noop_audit_once_each(
        self,
    ) -> None:
        self.client.force_login(self.editor)

        deactivate = as_response(
            self.client.patch(
                self.set_detail_url(),
                {"is_active": False},
                format="json",
            )
        )
        deactivate_noop = as_response(
            self.client.patch(
                self.set_detail_url(),
                {"is_active": False},
                format="json",
            )
        )
        activate = as_response(
            self.client.patch(
                self.set_detail_url(),
                {"is_active": True},
                format="json",
            )
        )
        activate_noop = as_response(
            self.client.patch(
                self.set_detail_url(),
                {"is_active": True},
                format="json",
            )
        )

        for response in (
            deactivate,
            deactivate_noop,
            activate,
            activate_noop,
        ):
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(
            AuditEvent.objects.filter(
                action=AuditAction.REFERENCE_DATA_SET_DEACTIVATED,
            ).count(),
            1,
        )
        self.assertEqual(
            AuditEvent.objects.filter(
                action=AuditAction.REFERENCE_DATA_SET_ACTIVATED,
            ).count(),
            1,
        )
        self.assertFalse(
            AuditEvent.objects.filter(
                action=AuditAction.REFERENCE_DATA_SET_UPDATED,
            ).exists()
        )

    def test_value_listing_search_and_pagination_are_scoped_to_set(self) -> None:
        _ = ReferenceDataValue.objects.create(
            reference_set=self.secondary_set,
            code="ALPHA",
            name="Alpha elsewhere",
        )
        self.client.force_login(self.direct_viewer)

        response = as_response(
            self.client.get(
                self.value_directory_url(),
                {
                    "search": "Alpha",
                    "page_size": 1,
                },
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["page_size"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(self.alpha.pk))

    def test_value_listing_filters_by_active_state(self) -> None:
        self.beta.is_active = False
        self.beta.save(update_fields=["is_active"])
        self.client.force_login(self.direct_viewer)

        response = as_response(
            self.client.get(
                self.value_directory_url(),
                {"is_active": "false"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["results"][0]["code"], "BETA")

    def test_value_ordering_uses_sort_order_then_name_code_and_id(self) -> None:
        _ = ReferenceDataValue.objects.create(
            reference_set=self.primary_set,
            code="EARLY",
            name="Early",
            sort_order=1,
        )
        self.client.force_login(self.direct_viewer)

        response = as_response(
            self.client.get(
                self.value_directory_url(),
                {"page_size": 100},
            )
        )

        ordering = [
            (
                item["sort_order"],
                item["name"],
                item["code"],
                item["id"],
            )
            for item in response.data["results"]
        ]
        self.assertEqual(ordering, sorted(ordering))

    def test_successful_value_creation_and_audit(self) -> None:
        self.client.force_login(self.value_creator)

        response = as_response(
            self.client.post(
                self.value_directory_url(),
                {
                    "code": " gamma ",
                    "name": " Gamma ",
                    "description": " Third value ",
                    "sort_order": 30,
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        value = ReferenceDataValue.objects.get(
            reference_set=self.primary_set,
            code="GAMMA",
        )
        self.assertEqual(value.name, "Gamma")
        event = AuditEvent.objects.get(
            action=AuditAction.REFERENCE_DATA_VALUE_CREATED,
        )
        self.assertEqual(event.target_type, AuditTarget.REFERENCE_DATA_VALUE)
        self.assertEqual(event.target_id, str(value.pk))
        self.assertEqual(
            event.changes["fields"]["reference_set_id"],
            {"to": str(self.primary_set.pk)},
        )

    def test_duplicate_value_code_is_scoped_and_rejected_without_audit(self) -> None:
        self.client.force_login(self.value_creator)

        duplicate = as_response(
            self.client.post(
                self.value_directory_url(),
                {"code": "alpha", "name": "Duplicate"},
                format="json",
            )
        )
        other_set = as_response(
            self.client.post(
                self.value_directory_url(self.secondary_set),
                {"code": "alpha", "name": "Allowed elsewhere"},
                format="json",
            )
        )

        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", duplicate.data)
        self.assertEqual(other_set.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            AuditEvent.objects.filter(
                action=AuditAction.REFERENCE_DATA_VALUE_CREATED,
            ).count(),
            1,
        )

    def test_successful_value_edit_and_deactivate_are_audited(self) -> None:
        self.client.force_login(self.value_editor)

        response = as_response(
            self.client.patch(
                self.value_detail_url(),
                {
                    "name": " Alpha updated ",
                    "sort_order": 5,
                    "is_active": False,
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.alpha.refresh_from_db()
        self.assertEqual(self.alpha.name, "Alpha updated")
        self.assertEqual(self.alpha.sort_order, 5)
        self.assertFalse(self.alpha.is_active)

        updated = AuditEvent.objects.get(
            action=AuditAction.REFERENCE_DATA_VALUE_UPDATED,
        )
        deactivated = AuditEvent.objects.get(
            action=AuditAction.REFERENCE_DATA_VALUE_DEACTIVATED,
        )
        self.assertEqual(
            updated.changes["fields"]["sort_order"],
            {"from": 10, "to": 5},
        )
        self.assertEqual(
            deactivated.changes,
            {
                "fields": {
                    "is_active": {
                        "from": True,
                        "to": False,
                    }
                }
            },
        )

    def test_value_code_is_immutable_and_failed_patch_is_not_audited(self) -> None:
        self.client.force_login(self.value_editor)

        response = as_response(
            self.client.patch(
                self.value_detail_url(),
                {
                    "code": "RENAMED",
                    "sort_order": 3,
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.alpha.refresh_from_db()
        self.assertEqual(self.alpha.code, "ALPHA")
        self.assertEqual(self.alpha.sort_order, 10)
        self.assertFalse(AuditEvent.objects.exists())

    def test_value_noop_does_not_create_duplicate_audit_event(self) -> None:
        self.client.force_login(self.value_editor)

        response = as_response(
            self.client.patch(
                self.value_detail_url(),
                {
                    "name": self.alpha.name,
                    "description": self.alpha.description,
                    "sort_order": self.alpha.sort_order,
                    "is_active": self.alpha.is_active,
                },
                format="json",
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(AuditEvent.objects.exists())

    def test_consumer_query_returns_only_active_values_from_active_set(self) -> None:
        self.beta.is_active = False
        self.beta.save(update_fields=["is_active"])
        _ = ReferenceDataValue.objects.create(
            reference_set=self.primary_set,
            code="EARLY",
            name="Early",
            sort_order=1,
        )

        values = list(
            get_active_reference_data_values(
                reference_set_code=" general ",
            )
        )

        self.assertEqual(
            [value.code for value in values],
            ["EARLY", "ALPHA"],
        )

        self.primary_set.is_active = False
        self.primary_set.save(update_fields=["is_active"])

        self.assertFalse(
            get_active_reference_data_values(
                reference_set_code="GENERAL",
            ).exists()
        )

    def test_reference_data_delete_methods_are_not_exposed(self) -> None:
        self.client.force_login(self.superuser)

        responses = [
            as_response(self.client.delete(self.set_detail_url())),
            as_response(self.client.delete(self.value_detail_url())),
        ]

        self.assertTrue(
            all(
                response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
                for response in responses
            )
        )
