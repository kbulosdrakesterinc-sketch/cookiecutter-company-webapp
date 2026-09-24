from collections.abc import Iterable

from django.contrib.auth.models import Group, Permission
from django.db import IntegrityError, transaction

from apps.accounts.models import User
from apps.audit.services import AuditAction, AuditTarget, record_audit_event


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
        Permission.objects.select_related("content_type")
        .filter(pk__in=requested_ids)
        .order_by("pk")
    )
    found_ids = {permission.pk for permission in permissions}
    invalid_ids = requested_ids - found_ids

    if invalid_ids:
        raise InvalidRolePermissionIdsError(invalid_ids)

    return permissions


def _permission_entry(permission: Permission) -> dict[str, object]:
    return {
        "id": permission.pk,
        "name": permission.name,
        "permission": (
            f"{permission.content_type.app_label}.{permission.codename}"
        ),
    }


def create_role(
    *,
    actor: User,
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
            _ = record_audit_event(
                actor=actor,
                action=AuditAction.ROLE_CREATED,
                target_type=AuditTarget.ROLE,
                target_id=role.pk,
                target_display=role.name,
                changes={
                    "fields": {
                        "name": {"to": role.name},
                    },
                    "direct_permissions": {
                        "added": [
                            _permission_entry(permission)
                            for permission in permissions
                        ],
                        "removed": [],
                    },
                },
            )
            return role
    except IntegrityError as error:
        if Group._default_manager.filter(name=normalized_name).exists():
            raise RoleNameAlreadyExistsError(
                "A role with this name already exists.",
            ) from error

        raise


def update_role(
    *,
    actor: User,
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
            existing_permissions = (
                list(
                    role.permissions.select_related("content_type").order_by("pk")
                )
                if permissions is not None
                else None
            )

            if normalized_name is not None and normalized_name != role.name:
                previous_name = role.name
                role.name = normalized_name
                role.save(update_fields=["name"])
                _ = record_audit_event(
                    actor=actor,
                    action=AuditAction.ROLE_RENAMED,
                    target_type=AuditTarget.ROLE,
                    target_id=role.pk,
                    target_display=role.name,
                    changes={
                        "fields": {
                            "name": {
                                "from": previous_name,
                                "to": role.name,
                            }
                        }
                    },
                )

            if permissions is not None and existing_permissions is not None:
                existing_by_id = {
                    permission.pk: permission
                    for permission in existing_permissions
                }
                requested_by_id = {
                    permission.pk: permission for permission in permissions
                }
                added_ids = sorted(
                    requested_by_id.keys() - existing_by_id.keys()
                )
                removed_ids = sorted(
                    existing_by_id.keys() - requested_by_id.keys()
                )

                if added_ids or removed_ids:
                    role.permissions.set(permissions)
                    _ = record_audit_event(
                        actor=actor,
                        action=AuditAction.ROLE_PERMISSIONS_CHANGED,
                        target_type=AuditTarget.ROLE,
                        target_id=role.pk,
                        target_display=role.name,
                        changes={
                            "direct_permissions": {
                                "added": [
                                    _permission_entry(requested_by_id[permission_id])
                                    for permission_id in added_ids
                                ],
                                "removed": [
                                    _permission_entry(existing_by_id[permission_id])
                                    for permission_id in removed_ids
                                ],
                            }
                        },
                    )

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
