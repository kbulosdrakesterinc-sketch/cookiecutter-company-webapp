from typing import NotRequired, TypedDict, cast
from uuid import UUID

from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.reference_data.models import ReferenceDataSet, ReferenceDataValue
from apps.reference_data.queries import (
    get_reference_data_set_directory_queryset,
    get_reference_data_set_queryset,
    get_reference_data_value_queryset,
)
from apps.reference_data.services import (
    ReferenceDataSetCodeAlreadyExistsError,
    ReferenceDataValueCodeAlreadyExistsError,
    create_reference_data_set,
    create_reference_data_value,
    update_reference_data_set,
    update_reference_data_value,
)

from .pagination import ReferenceDataDirectoryPagination
from .permissions import (
    ReferenceDataSetDetailPermission,
    ReferenceDataSetDirectoryPermission,
    ReferenceDataValueDetailPermission,
    ReferenceDataValueDirectoryPermission,
)
from .serializers import (
    ReferenceDataSetManagementSerializer,
    ReferenceDataSetSerializer,
    ReferenceDataValueManagementSerializer,
    ReferenceDataValueSerializer,
)


class ReferenceDataSetCreateData(TypedDict):
    code: str
    name: str
    description: NotRequired[str]
    is_active: NotRequired[bool]


class ReferenceDataSetUpdateData(TypedDict):
    name: NotRequired[str]
    description: NotRequired[str]
    is_active: NotRequired[bool]


class ReferenceDataValueCreateData(TypedDict):
    code: str
    name: str
    description: NotRequired[str]
    sort_order: NotRequired[int]
    is_active: NotRequired[bool]


class ReferenceDataValueUpdateData(TypedDict):
    name: NotRequired[str]
    description: NotRequired[str]
    sort_order: NotRequired[int]
    is_active: NotRequired[bool]




def _parse_active_filter(value: str | None) -> bool | None:
    if value is None or not value.strip():
        return None

    normalized = value.strip().lower()

    if normalized == "true":
        return True

    if normalized == "false":
        return False

    raise ValueError("Use 'true' or 'false'.")


def _get_authenticated_user(request: Request) -> User:
    return cast(
        User,
        cast(
            object,
            request.user,
        ),
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, ReferenceDataSetDirectoryPermission])
def reference_data_set_directory_view(request: Request) -> Response:
    """List reference-data sets or create one fixed-schema lookup set."""

    if request.method == "POST":
        serializer = ReferenceDataSetManagementSerializer(data=request.data)
        _ = serializer.is_valid(raise_exception=True)
        data = cast(
            ReferenceDataSetCreateData,
            serializer.validated_data,
        )

        missing_fields = [
            field for field in ("code", "name") if field not in data
        ]
        if missing_fields:
            return Response(
                {
                    field: ["This field is required."]
                    for field in missing_fields
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reference_set = create_reference_data_set(
                actor=_get_authenticated_user(request),
                code=data["code"],
                name=data["name"],
                description=data.get("description", ""),
                is_active=data.get("is_active", True),
            )
        except ReferenceDataSetCodeAlreadyExistsError as error:
            return Response(
                {"code": [str(error)]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = get_object_or_404(
            get_reference_data_set_queryset(),
            pk=reference_set.pk,
        )
        return Response(
            ReferenceDataSetSerializer(created).data,
            status=status.HTTP_201_CREATED,
        )

    try:
        is_active = _parse_active_filter(
            request.query_params.get("is_active"),
        )
    except ValueError as error:
        return Response(
            {"is_active": [str(error)]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    queryset = get_reference_data_set_directory_queryset(
        search=request.query_params.get("search", ""),
        is_active=is_active,
    )
    paginator = ReferenceDataDirectoryPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = ReferenceDataSetSerializer(
        page,
        many=True,
    )
    return paginator.get_paginated_response(
        list(serializer.data),
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, ReferenceDataSetDetailPermission])
def reference_data_set_detail_view(
    request: Request,
    reference_set_id: UUID,
) -> Response:
    """Return or update one reference-data set."""

    if request.method == "PATCH":
        serializer = ReferenceDataSetManagementSerializer(
            data=request.data,
            partial=True,
        )
        _ = serializer.is_valid(raise_exception=True)
        data = cast(
            ReferenceDataSetUpdateData,
            serializer.validated_data,
        )

        try:
            reference_set = update_reference_data_set(
                actor=_get_authenticated_user(request),
                reference_set_id=reference_set_id,
                name=data.get("name"),
                description=data.get("description"),
                is_active=data.get("is_active"),
            )
        except ReferenceDataSet.DoesNotExist as error:
            raise Http404 from error

        updated = get_object_or_404(
            get_reference_data_set_queryset(),
            pk=reference_set.pk,
        )
        return Response(
            ReferenceDataSetSerializer(updated).data,
        )

    reference_set = get_object_or_404(
        get_reference_data_set_queryset(),
        pk=reference_set_id,
    )
    return Response(
        ReferenceDataSetSerializer(reference_set).data,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, ReferenceDataValueDirectoryPermission])
def reference_data_value_directory_view(
    request: Request,
    reference_set_id: UUID,
) -> Response:
    """List or create values inside one reference-data set."""

    _ = get_object_or_404(
        ReferenceDataSet,
        pk=reference_set_id,
    )

    if request.method == "POST":
        serializer = ReferenceDataValueManagementSerializer(
            data=request.data,
        )
        _ = serializer.is_valid(raise_exception=True)
        data = cast(
            ReferenceDataValueCreateData,
            serializer.validated_data,
        )

        missing_fields = [
            field for field in ("code", "name") if field not in data
        ]
        if missing_fields:
            return Response(
                {
                    field: ["This field is required."]
                    for field in missing_fields
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            value = create_reference_data_value(
                actor=_get_authenticated_user(request),
                reference_set_id=reference_set_id,
                code=data["code"],
                name=data["name"],
                description=data.get("description", ""),
                sort_order=data.get("sort_order", 0),
                is_active=data.get("is_active", True),
            )
        except ReferenceDataValueCodeAlreadyExistsError as error:
            return Response(
                {"code": [str(error)]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            ReferenceDataValueSerializer(value).data,
            status=status.HTTP_201_CREATED,
        )

    try:
        is_active = _parse_active_filter(
            request.query_params.get("is_active"),
        )
    except ValueError as error:
        return Response(
            {"is_active": [str(error)]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    queryset = get_reference_data_value_queryset(
        reference_set_id=reference_set_id,
        search=request.query_params.get("search", ""),
        is_active=is_active,
    )
    paginator = ReferenceDataDirectoryPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = ReferenceDataValueSerializer(
        page,
        many=True,
    )
    return paginator.get_paginated_response(
        list(serializer.data),
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated, ReferenceDataValueDetailPermission])
def reference_data_value_detail_view(
    request: Request,
    reference_set_id: UUID,
    value_id: UUID,
) -> Response:
    """Return or update one value inside its parent set."""

    if request.method == "PATCH":
        serializer = ReferenceDataValueManagementSerializer(
            data=request.data,
            partial=True,
        )
        _ = serializer.is_valid(raise_exception=True)
        data = cast(
            ReferenceDataValueUpdateData,
            serializer.validated_data,
        )

        try:
            value = update_reference_data_value(
                actor=_get_authenticated_user(request),
                reference_set_id=reference_set_id,
                value_id=value_id,
                name=data.get("name"),
                description=data.get("description"),
                sort_order=data.get("sort_order"),
                is_active=data.get("is_active"),
            )
        except ReferenceDataValue.DoesNotExist as error:
            raise Http404 from error

        return Response(
            ReferenceDataValueSerializer(value).data,
        )

    value = get_object_or_404(
        ReferenceDataValue.objects.select_related("reference_set"),
        pk=value_id,
        reference_set_id=reference_set_id,
    )
    return Response(
        ReferenceDataValueSerializer(value).data,
    )
