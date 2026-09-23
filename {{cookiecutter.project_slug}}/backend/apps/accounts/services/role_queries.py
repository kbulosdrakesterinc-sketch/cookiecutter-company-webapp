from django.contrib.auth.models import Group, Permission
from django.db.models import Count, Prefetch, QuerySet

from apps.accounts.models import User


def get_role_directory_queryset(
    *,
    search: str = "",
) -> QuerySet[Group]:
    queryset = Group._default_manager.annotate(
        user_count=Count(
            "user",
            distinct=True,
        ),
        permission_count=Count(
            "permissions",
            distinct=True,
        ),
    )

    normalized_search = search.strip()

    if normalized_search:
        queryset = queryset.filter(
            name__icontains=normalized_search,
        )

    return queryset.order_by(
        "name",
        "id",
    )


def get_role_detail_queryset() -> QuerySet[Group]:
    users = User.objects.order_by(
        "email",
        "id",
    )
    permissions = Permission.objects.select_related(
        "content_type",
    ).order_by(
        "content_type__app_label",
        "content_type__model",
        "codename",
        "id",
    )

    return Group._default_manager.prefetch_related(
        Prefetch(
            "user_set",
            queryset=users,
            to_attr="direct_users",
        ),
        Prefetch(
            "permissions",
            queryset=permissions,
            to_attr="direct_permissions",
        ),
    )
