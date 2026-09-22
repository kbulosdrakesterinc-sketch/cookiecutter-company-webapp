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
