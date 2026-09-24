from datetime import datetime

from django.db.models import QuerySet

from .models import AuditEvent


def get_audit_event_directory_queryset(
    *,
    action: str | None = None,
    target_type: str | None = None,
    actor: str | None = None,
    occurred_after: datetime | None = None,
    occurred_before: datetime | None = None,
) -> QuerySet[AuditEvent]:
    """Build the read-only audit directory query."""

    queryset = AuditEvent.objects.all()

    if action is not None:
        queryset = queryset.filter(action=action)

    if target_type is not None:
        queryset = queryset.filter(target_type=target_type)

    if actor is not None:
        queryset = queryset.filter(actor_identifier__icontains=actor)

    if occurred_after is not None:
        queryset = queryset.filter(occurred_at__gte=occurred_after)

    if occurred_before is not None:
        queryset = queryset.filter(occurred_at__lte=occurred_before)

    return queryset.order_by(
        "-occurred_at",
        "-id",
    )
