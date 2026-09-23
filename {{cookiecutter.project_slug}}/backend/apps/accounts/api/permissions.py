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
