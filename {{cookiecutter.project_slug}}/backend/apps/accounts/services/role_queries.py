from django.contrib.auth.models import Group
from django.db.models import Count, QuerySet


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
