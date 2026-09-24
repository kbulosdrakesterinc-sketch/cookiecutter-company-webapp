from uuid import UUID

from django.db.models import Count, Q, QuerySet

from .models import ReferenceDataSet, ReferenceDataValue


def get_reference_data_set_directory_queryset(
    *,
    search: str = "",
    is_active: bool | None = None,
) -> QuerySet[ReferenceDataSet]:
    queryset = ReferenceDataSet.objects.annotate(
        value_count=Count("values"),
    )
    normalized_search = search.strip()

    if normalized_search:
        queryset = queryset.filter(
            Q(code__icontains=normalized_search)
            | Q(name__icontains=normalized_search)
            | Q(description__icontains=normalized_search)
        )

    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)

    return queryset.order_by(
        "name",
        "code",
        "id",
    )


def get_reference_data_set_queryset() -> QuerySet[ReferenceDataSet]:
    return ReferenceDataSet.objects.annotate(
        value_count=Count("values"),
    ).order_by(
        "name",
        "code",
        "id",
    )


def get_reference_data_value_queryset(
    *,
    reference_set_id: UUID,
    search: str = "",
    is_active: bool | None = None,
) -> QuerySet[ReferenceDataValue]:
    queryset = ReferenceDataValue.objects.filter(
        reference_set_id=reference_set_id,
    )
    normalized_search = search.strip()

    if normalized_search:
        queryset = queryset.filter(
            Q(code__icontains=normalized_search)
            | Q(name__icontains=normalized_search)
            | Q(description__icontains=normalized_search)
        )

    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)

    return queryset.order_by(
        "sort_order",
        "name",
        "code",
        "id",
    )


def get_active_reference_data_values(
    *,
    reference_set_code: str,
) -> QuerySet[ReferenceDataValue]:
    """Return consumer-facing active values for one active lookup set."""

    return ReferenceDataValue.objects.filter(
        reference_set__code=reference_set_code.strip().upper(),
        reference_set__is_active=True,
        is_active=True,
    ).order_by(
        "sort_order",
        "name",
        "code",
        "id",
    )
