from typing import override

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import User


class CanViewAuditEventDirectory(BasePermission):
    message: str = "You do not have permission to view audit events."

    @override
    def has_permission(
        self,
        request: Request,
        view: APIView,
    ) -> bool:
        user = request.user

        if not isinstance(user, User):
            return False

        return user.has_perm("audit.view_auditevent")
