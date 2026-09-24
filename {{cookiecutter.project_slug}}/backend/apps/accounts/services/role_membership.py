from collections.abc import Iterable
from uuid import UUID

from django.contrib.auth.models import Group
from django.db import transaction

from apps.accounts.models import User


class InvalidRoleMemberIdsError(ValueError):
    def __init__(self, invalid_ids: Iterable[UUID]) -> None:
        self.invalid_ids = tuple(
            sorted(
                set(invalid_ids),
                key=str,
            )
        )
        super().__init__("One or more selected users do not exist.")


class ConflictingRoleMemberIdsError(ValueError):
    pass


def _resolve_users(user_ids: Iterable[UUID]) -> list[User]:
    requested_ids = set(user_ids)

    if not requested_ids:
        return []

    users = list(
        User.objects.select_for_update()
        .filter(pk__in=requested_ids)
        .order_by("pk")
    )
    found_ids = {user.pk for user in users}
    invalid_ids = requested_ids - found_ids

    if invalid_ids:
        raise InvalidRoleMemberIdsError(invalid_ids)

    return users


def update_role_membership(
    *,
    role_id: int,
    add_user_ids: Iterable[UUID] = (),
    remove_user_ids: Iterable[UUID] = (),
) -> Group:
    """Apply a membership delta to one Django Group atomically."""

    add_ids = set(add_user_ids)
    remove_ids = set(remove_user_ids)
    overlap = add_ids & remove_ids

    if overlap:
        raise ConflictingRoleMemberIdsError(
            "A user cannot be both added and removed in one request."
        )

    with transaction.atomic():
        role = Group._default_manager.select_for_update().get(pk=role_id)
        users = _resolve_users(add_ids | remove_ids)
        users_by_id = {user.pk: user for user in users}

        for user_id in sorted(add_ids, key=str):
            users_by_id[user_id].groups.add(role)

        for user_id in sorted(remove_ids, key=str):
            users_by_id[user_id].groups.remove(role)

        return role
