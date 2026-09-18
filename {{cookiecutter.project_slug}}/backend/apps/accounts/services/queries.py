from dataclasses import dataclass
from uuid import UUID

from apps.accounts.models import User
from django.contrib.auth.models import Group


@dataclass(frozen=True, slots=True)
class CurrentUserProfile:
    id: UUID
    email: str
    first_name: str
    last_name: str
    is_staff: bool
    is_superuser: bool
    roles: tuple[str, ...]
    permissions: tuple[str, ...]


def get_current_user_profile(
    *,
    user: User,
) -> CurrentUserProfile:
    role_names = tuple(
        Group._default_manager.filter(
            user=user,
        )
        .order_by(
            "name",
        )
        .values_list(
            "name",
            flat=True,
        )
    )

    permission_names = tuple(
        sorted(
            user.get_all_permissions(),
        )
    )

    return CurrentUserProfile(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_staff=user.is_staff,
        is_superuser=user.is_superuser,
        roles=role_names,
        permissions=permission_names,
    )
