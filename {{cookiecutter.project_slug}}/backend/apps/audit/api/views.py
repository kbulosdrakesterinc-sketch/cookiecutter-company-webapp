from datetime import datetime
from typing import NotRequired, TypedDict, cast

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.audit.queries import get_audit_event_directory_queryset

from .pagination import AuditEventDirectoryPagination
from .permissions import CanViewAuditEventDirectory
from .serializers import (
    AuditEventDirectorySerializer,
    AuditEventFilterSerializer,
)


class AuditEventFilterData(TypedDict):
    action: NotRequired[str]
    target_type: NotRequired[str]
    actor: NotRequired[str]
    occurred_after: NotRequired[datetime]
    occurred_before: NotRequired[datetime]


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanViewAuditEventDirectory])
def audit_event_directory_view(request: Request) -> Response:
    """Return a filtered, newest-first audit event directory."""

    filter_serializer = AuditEventFilterSerializer(
        data=request.query_params
    )
    filter_serializer.is_valid(raise_exception=True)
    filters = cast(
        AuditEventFilterData,
        filter_serializer.validated_data,
    )

    queryset = get_audit_event_directory_queryset(
        action=filters.get("action"),
        target_type=filters.get("target_type"),
        actor=filters.get("actor"),
        occurred_after=filters.get("occurred_after"),
        occurred_before=filters.get("occurred_before"),
    )

    paginator = AuditEventDirectoryPagination()
    page = paginator.paginate_queryset(
        queryset,
        request,
    )
    serializer = AuditEventDirectorySerializer(
        page,
        many=True,
    )

    return paginator.get_paginated_response(
        list(serializer.data),
    )
