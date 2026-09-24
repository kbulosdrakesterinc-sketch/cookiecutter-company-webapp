from django.urls import include, path

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
]
