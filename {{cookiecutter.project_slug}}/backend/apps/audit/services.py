from collections.abc import Mapping

from apps.accounts.models import User

from .models import AuditEvent


class AuditAction:
    USER_PROVISIONED = "admin.user.provisioned"
    USER_UPDATED = "admin.user.updated"
    USER_ACTIVATED = "admin.user.activated"
    USER_DEACTIVATED = "admin.user.deactivated"
    ROLE_CREATED = "admin.role.created"
    ROLE_RENAMED = "admin.role.renamed"
    ROLE_PERMISSIONS_CHANGED = "admin.role.permissions_changed"
    ROLE_MEMBERSHIP_CHANGED = "admin.role.membership_changed"


class AuditTarget:
    USER = "accounts.user"
    ROLE = "auth.group"


def record_audit_event(
    *,
    actor: User | None,
    action: str,
    target_type: str,
    target_id: str | int,
    target_display: str,
    changes: Mapping[str, object] | None = None,
    context: Mapping[str, object] | None = None,
) -> AuditEvent:
    """Persist one audit event inside the caller's transaction boundary."""

    return AuditEvent.objects.create(
        actor=actor,
        actor_identifier=actor.email if actor is not None else "",
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        target_display=target_display,
        changes=dict(changes or {}),
        context=dict(context or {}),
    )
