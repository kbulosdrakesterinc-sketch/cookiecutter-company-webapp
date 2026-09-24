from collections.abc import Iterable

from django.contrib.auth.models import Group, Permission
from django.db import IntegrityError, transaction


class RoleNameAlreadyExistsError(ValueError):
    pass


class InvalidRolePermissionIdsError(ValueError):
    def __init__(self, invalid_ids: Iterable[int]) -> None:
        self.invalid_ids = tuple(sorted(set(invalid_ids)))
        super().__init__("One or more selected permissions do not exist.")


def _resolve_permissions(permission_ids: Iterable[int]) -> list[Permission]:
    requested_ids = set(permission_ids)

    if not requested_ids:
        return []

    permissions = list(
        Permission.objects.filter(pk__in=requested_ids).order_by("pk")
    )
    found_ids = {permission.pk for permission in permissions}
    invalid_ids = requested_ids - found_ids

    if invalid_ids:
        raise InvalidRolePermissionIdsError(invalid_ids)

    return permissions


def create_role(
    *,
    name: str,
    permission_ids: Iterable[int] = (),
) -> Group:
    """Create one Django Group and replace its direct permissions atomically."""

    normalized_name = name.strip()

    try:
        with transaction.atomic():
            permissions = _resolve_permissions(permission_ids)
            role = Group._default_manager.create(name=normalized_name)
            role.permissions.set(permissions)
            return role
    except IntegrityError as error:
        if Group._default_manager.filter(name=normalized_name).exists():
            raise RoleNameAlreadyExistsError(
                "A role with this name already exists.",
            ) from error

        raise


def update_role(
    *,
    role_id: int,
    name: str | None = None,
    permission_ids: Iterable[int] | None = None,
) -> Group:
    """Update supported Group fields with replacement permission semantics."""

    normalized_name = name.strip() if name is not None else None

    try:
        with transaction.atomic():
            role = Group._default_manager.select_for_update().get(pk=role_id)
            permissions = (
                _resolve_permissions(permission_ids)
                if permission_ids is not None
                else None
            )

            if normalized_name is not None:
                role.name = normalized_name
                role.save(update_fields=["name"])

            if permissions is not None:
                role.permissions.set(permissions)

            return role
    except IntegrityError as error:
        if (
            normalized_name is not None
            and Group._default_manager.exclude(pk=role_id)
            .filter(name=normalized_name)
            .exists()
        ):
            raise RoleNameAlreadyExistsError(
                "A role with this name already exists.",
            ) from error

        raise
