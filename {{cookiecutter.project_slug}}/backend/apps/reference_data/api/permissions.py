from typing import override

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import User


def _has_permission(request: Request, permission: str) -> bool:
    user = request.user

    if not isinstance(user, User):
        return False

    return user.has_perm(permission)


class ReferenceDataSetDirectoryPermission(BasePermission):
    """Map set-directory methods to generated Django model permissions."""

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        if request.method not in view.allowed_methods:
            return True

        if request.method == "GET":
            return _has_permission(
                request,
                "reference_data.view_referencedataset",
            )

        if request.method == "POST":
            return _has_permission(
                request,
                "reference_data.add_referencedataset",
            )

        return False


class ReferenceDataSetDetailPermission(BasePermission):
    """Map set-detail methods to generated Django model permissions."""

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        if request.method not in view.allowed_methods:
            return True

        if request.method == "GET":
            return _has_permission(
                request,
                "reference_data.view_referencedataset",
            )

        if request.method == "PATCH":
            return _has_permission(
                request,
                "reference_data.change_referencedataset",
            )

        return False


class ReferenceDataValueDirectoryPermission(BasePermission):
    """View values with area access; create with the generated add permission."""

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        if request.method not in view.allowed_methods:
            return True

        if request.method == "GET":
            return _has_permission(
                request,
                "reference_data.view_referencedataset",
            )

        if request.method == "POST":
            return _has_permission(
                request,
                "reference_data.add_referencedatavalue",
            )

        return False


class ReferenceDataValueDetailPermission(BasePermission):
    """View values with area access; edit with the generated change permission."""

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        if request.method not in view.allowed_methods:
            return True

        if request.method == "GET":
            return _has_permission(
                request,
                "reference_data.view_referencedataset",
            )

        if request.method == "PATCH":
            return _has_permission(
                request,
                "reference_data.change_referencedatavalue",
            )

        return False
