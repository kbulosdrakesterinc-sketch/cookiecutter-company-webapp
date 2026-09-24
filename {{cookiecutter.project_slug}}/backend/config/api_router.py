from django.urls import include, path

from apps.audit.api.views import audit_event_directory_view
from apps.reference_data.api.views import (
    reference_data_set_detail_view,
    reference_data_set_directory_view,
    reference_data_value_detail_view,
    reference_data_value_directory_view,
)
from apps.accounts.api.views import (
    permission_catalog_view,
    role_detail_view,
    role_directory_view,
    role_membership_candidates_view,
    role_membership_view,
    user_detail_view,
    user_directory_view,
)

app_name = "v1"

urlpatterns = [
    path(
        "",
        include("apps.core.api.urls"),
    ),
    path(
        "auth/",
        include("apps.accounts.api.urls"),
    ),
    path(
        "users/",
        user_directory_view,
        name="user-directory",
    ),
    path(
        "users/<uuid:user_id>/",
        user_detail_view,
        name="user-detail",
    ),
    path(
        "permissions/",
        permission_catalog_view,
        name="permission-catalog",
    ),
    path(
        "roles/",
        role_directory_view,
        name="role-directory",
    ),
    path(
        "roles/<int:role_id>/",
        role_detail_view,
        name="role-detail",
    ),
    path(
        "roles/<int:role_id>/membership/",
        role_membership_view,
        name="role-membership",
    ),
    path(
        "roles/<int:role_id>/membership-candidates/",
        role_membership_candidates_view,
        name="role-membership-candidates",
    ),
    path(
        "audit-events/",
        audit_event_directory_view,
        name="audit-event-directory",
    ),
    path(
        "reference-data/",
        reference_data_set_directory_view,
        name="reference-data-set-directory",
    ),
    path(
        "reference-data/<uuid:reference_set_id>/",
        reference_data_set_detail_view,
        name="reference-data-set-detail",
    ),
    path(
        "reference-data/<uuid:reference_set_id>/values/",
        reference_data_value_directory_view,
        name="reference-data-value-directory",
    ),
    path(
        "reference-data/<uuid:reference_set_id>/values/<uuid:value_id>/",
        reference_data_value_detail_view,
        name="reference-data-value-detail",
    ),
]
