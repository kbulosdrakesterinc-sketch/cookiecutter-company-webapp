from typing import override

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import User


class CanViewUserDirectory(BasePermission):
    message: str = "You do not have permission to view users."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("accounts.view_user")


class CanViewRoleDirectory(BasePermission):
    message: str = "You do not have permission to view roles."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("auth.view_group")


class CanAddRole(BasePermission):
    message: str = "You do not have permission to create roles."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("auth.add_group")


class CanChangeRole(BasePermission):
    message: str = "You do not have permission to manage roles."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("auth.change_group")


class CanUseRolePermissionCatalog(BasePermission):
    """Allow callers who can create or change Groups to inspect permissions."""

    message: str = "You do not have permission to manage role permissions."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("auth.add_group") or user.has_perm(
            "auth.change_group"
        )


class CanProvisionUser(BasePermission):
    message: str = "You do not have permission to provision users."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("accounts.add_user")


class CanManageUser(BasePermission):
    message: str = "You do not have permission to manage users."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("accounts.change_user")


class UserDirectoryPermission(BasePermission):
    """Map each Users-resource method to its Django model permission."""

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        if request.method == "GET":
            return CanViewUserDirectory().has_permission(
                request,
                view,
            )

        if request.method == "POST":
            return CanProvisionUser().has_permission(
                request,
                view,
            )

        return False


class RoleDirectoryPermission(BasePermission):
    """Map role-directory methods to Django Group permissions."""

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        if request.method == "GET":
            return CanViewRoleDirectory().has_permission(
                request,
                view,
            )

        if request.method == "POST":
            return CanAddRole().has_permission(
                request,
                view,
            )

        return False


class RoleDetailPermission(BasePermission):
    """Map role-detail methods to Django Group permissions."""

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        if request.method == "GET":
            return CanViewRoleDirectory().has_permission(
                request,
                view,
            )

        if request.method == "PATCH":
            return CanChangeRole().has_permission(
                request,
                view,
            )

        return False
